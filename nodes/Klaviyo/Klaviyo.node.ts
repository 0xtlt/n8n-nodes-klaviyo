import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
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
				],
				default: 'flow',
			},

			...FlowsDescriptionOperations,
			...FlowsFields,
			...TemplateDescriptionOperations,
			...TemplateFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const credentials = await this.getCredentials('klaviyoApi');

		let method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET';
		let route = '/templates';
		let body: any = {};

		const action = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

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

		return [this.helpers.returnJsonArray(response)];
	}
}
