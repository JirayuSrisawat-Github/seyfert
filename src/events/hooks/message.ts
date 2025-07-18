import { type MessageStructure, Transformers } from '../../client/transformers';
import type { UsingClient } from '../../commands';
import { fakePromise, type ObjectToLower, type OmitInsert, toCamelCase } from '../../common';
import type {
	GatewayMessageCreateDispatchData,
	GatewayMessageDeleteBulkDispatchData,
	GatewayMessageDeleteDispatchData,
	GatewayMessageReactionAddDispatchData,
	GatewayMessageReactionRemoveAllDispatchData,
	GatewayMessageReactionRemoveDispatchData,
	GatewayMessageReactionRemoveEmojiDispatchData,
	GatewayMessageUpdateDispatchData,
} from '../../types';
import type { GatewayMessagePollVoteAddDispatch, GatewayMessagePollVoteRemoveDispatch } from '../../types/gateway';

export const MESSAGE_CREATE = (self: UsingClient, data: GatewayMessageCreateDispatchData): MessageStructure => {
	return Transformers.Message(self, data);
};

export const MESSAGE_DELETE = async (
	self: UsingClient,
	data: GatewayMessageDeleteDispatchData,
): Promise<MessageStructure | ObjectToLower<GatewayMessageDeleteDispatchData>> => {
	return (await self.cache.messages?.get(data.id)) ?? toCamelCase(data);
};

export const MESSAGE_DELETE_BULK = async (
	self: UsingClient,
	data: GatewayMessageDeleteBulkDispatchData,
): Promise<GatewayMessageDeleteBulkDispatchData & { messages: (MessageStructure | string)[] }> => {
	return {
		...data,
		messages: await Promise.all(data.ids.map(id => fakePromise(self.cache.messages?.get(id)).then(x => x ?? id))),
	};
};

export const MESSAGE_REACTION_ADD = (_self: UsingClient, data: GatewayMessageReactionAddDispatchData) => {
	return toCamelCase(data);
};

export const MESSAGE_REACTION_REMOVE = (_self: UsingClient, data: GatewayMessageReactionRemoveDispatchData) => {
	return toCamelCase(data);
};

export const MESSAGE_REACTION_REMOVE_ALL = (_self: UsingClient, data: GatewayMessageReactionRemoveAllDispatchData) => {
	return toCamelCase(data);
};

export const MESSAGE_REACTION_REMOVE_EMOJI = (
	_self: UsingClient,
	data: GatewayMessageReactionRemoveEmojiDispatchData,
) => {
	return toCamelCase(data);
};

export const MESSAGE_UPDATE = async (
	self: UsingClient,
	data: GatewayMessageUpdateDispatchData,
): Promise<[message: OmitInsert<MessageStructure, 'tts', { tts: false }>, old: undefined | MessageStructure]> => {
	return [Transformers.Message(self, data) as any, await self.cache.messages?.get(data.id)];
};

export const MESSAGE_POLL_VOTE_REMOVE = (_: UsingClient, data: GatewayMessagePollVoteRemoveDispatch['d']) => {
	return toCamelCase(data);
};

export const MESSAGE_POLL_VOTE_ADD = (_: UsingClient, data: GatewayMessagePollVoteAddDispatch['d']) => {
	return toCamelCase(data);
};
