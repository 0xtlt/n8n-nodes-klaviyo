import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { EventDescriptionOperations, EventFields } from './EventDescription';
import { FlowsDescriptionOperations, FlowsFields } from './FlowsDescription';
import { TemplateDescriptionOperations, TemplateFields } from './TemplateDescription';

export class Klaviyo implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Klaviyo',
		name: 'klaviyo',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-icon-not-svg
		icon: 'file:logo.png',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Klaviyo API',
		defaults: {
			name: 'Klaviyo',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'klaviyoApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://a.klaviyo.com/api',
			url: '',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		/**
		 * In the properties array we have two mandatory options objects required
		 *
		 * [Resource & Operation]
		 */
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Flow',
						value: 'flow',
					},
					{
						name: 'Template',
						value: 'template',
					},
					{
						name: 'Event',
						value: 'event',
					},
				],
				default: 'flow',
			},

			...FlowsDescriptionOperations,
			...FlowsFields,
			...TemplateDescriptionOperations,
			...TemplateFields,
			...EventDescriptionOperations,
			...EventFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData = [];

		const credentials = await this.getCredentials('klaviyoApi');
		const action = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		let method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET';
		let route = '/templates';

		for (let i = 0; i < items.length; i++) {
			let body: any = {};

			if (action === 'template') {
				if (operation === 'get_one') {
					const id = this.getNodeParameter('templateId', 0) as string;
					const fields = this.getNodeParameter('fields', 0) as string[];

					route = `/templates/${id}/?fields[template]=${fields.join(',')}`;
				}

				if (operation === 'post_render') {
					const id = this.getNodeParameter('templateId', 0) as string;
					method = 'POST';
					const variables = this.getNodeParameter('variables', 0) as {
						variable: {
							name: string;
							value: string;
						}[];
					};

					body = {
						data: {
							type: 'template',
							attributes: {
								context: variables.variable.reduce((acc, cur) => {
									acc[cur.name] = cur.value;
									return acc;
								}, {} as any),

								id: id,
							},
						},
					};

					route = `/template-render`;
				}
			} else if (action === 'event') {
				if (operation === 'post_create') {
					const metricName = this.getNodeParameter('metricName', 0) as string;
					const properties = this.getNodeParameter('properties', 0) as {
						metricService?: { metricService: string };
						time?: { time: string };
						value?: { value: number };
						uniqueId?: { uniqueId: string };
					};
					const profiles = this.getNodeParameter('profile', 0) as {
						profile: {
							key: string;
							value: string;
						}[];
					};
					const attributes = this.getNodeParameter('attributes', 0) as {
						attribute: {
							key: string;
							value: string;
						}[];
					};

					method = 'POST';

					body = {
						data: {
							type: 'event',
							attributes: {
								// context: variables.variable.reduce((acc, cur) => {
								// 	acc[cur.name] = cur.value;
								// 	return acc;
								// }, {} as any),
								profile: profiles.profile.reduce((acc, cur) => {
									acc[cur.key] = cur.value;
									return acc;
								}, {} as any),
								metric: {
									name: metricName,
								},
								properties: Object.entries(attributes.attribute).reduce((acc, cur) => {
									if (cur[1]) {
										acc[cur[1].key] = cur[1].value;
									}
									return acc;
								}, {} as any),
							},
						},
					};

					const entries = Object.entries(properties);
					for (const [key, value] of entries) {
						body.data.attributes[key] = (value as any)[key];
					}

					route = `/events`;
				}
			}

			const response = await this.helpers.httpRequest({
				method,
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
					Authorization: `Klaviyo-API-Key ${credentials.token}`,
					revision: '2023-01-24',
				},
				url: 'https://a.klaviyo.com/api' + route,
				body: JSON.stringify(body),
				// ignoreHttpStatusErrors: true,
			});

			returnData.push(response);
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
