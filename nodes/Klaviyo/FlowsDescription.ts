import { INodeProperties } from 'n8n-workflow';

// When the resource `flow` is selected, this `operation` parameter will be shown.
export const FlowsDescriptionOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['flow'],
			},
		},
		options: [
			{
				name: 'Get All',
				value: 'get_all',
				action: 'Get all',
				routing: {
					request: {
						method: 'GET',
						url: '/flows',
					},
				},
			},
		],
		default: 'get_all',
	},
];

const getOperation: INodeProperties[] = [
	{
		displayName: 'Events',
		name: 'events',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: false,
		},
		displayOptions: {
			show: {
				resource: ['flow'],
				operation: ['get_alld'],
			},
		},
		options: [
			{
				name: 'metadataValues',
				displayName: 'Metadata',
				values: [
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: 'Name of the metadata key to add.',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Value to set for the metadata key',
					},
				],
			},
		],
		default: [], // Initially selected options
		description: 'The events to be monitored',
	},
];

export const FlowsFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                                httpVerb:get                                */
	/* -------------------------------------------------------------------------- */
	...getOperation,
];
