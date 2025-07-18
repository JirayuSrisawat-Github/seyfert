import type { ReturnCache } from '../../cache';
import type {
	GuildMemberStructure,
	GuildStructure,
	InteractionGuildMemberStructure,
	UserStructure,
	WebhookMessageStructure,
} from '../../client/transformers';
import type {
	InteractionCreateBodyRequest,
	InteractionMessageUpdateBodyRequest,
	MakeRequired,
	MessageWebhookCreateBodyRequest,
	ModalCreateBodyRequest,
	ModalCreateOptions,
	UnionToTuple,
	When,
} from '../../common';
import type { AllChannels, EntryPointInteraction, ModalSubmitInteraction } from '../../structures';
import { MessageFlags, type RESTGetAPIGuildQuery } from '../../types';
import { BaseContext } from '../basecontext';
import type { RegisteredMiddlewares } from '../decorators';
import type { EntryPointCommand } from './entryPoint';
import type { CommandMetadata, ExtendContext, GlobalMetadata, UsingClient } from './shared';

export interface EntryPointContext<M extends keyof RegisteredMiddlewares = never> extends BaseContext, ExtendContext {}

export class EntryPointContext<M extends keyof RegisteredMiddlewares = never> extends BaseContext {
	constructor(
		readonly client: UsingClient,
		readonly interaction: EntryPointInteraction,
		readonly shardId: number,
		readonly command: EntryPointCommand,
	) {
		super(client);
	}

	metadata: CommandMetadata<UnionToTuple<M>> = {} as never;
	globalMetadata: GlobalMetadata = {};

	get t() {
		return this.client.t(this.interaction.locale ?? this.client.langs.defaultLang ?? 'en-US');
	}

	get fullCommandName() {
		return this.command.name;
	}

	write<WR extends boolean = false>(
		body: InteractionCreateBodyRequest,
		withResponse?: WR,
	): Promise<When<WR, WebhookMessageStructure, void>> {
		return this.interaction.write<WR>(body, withResponse);
	}

	modal(body: ModalCreateBodyRequest, options?: undefined): Promise<undefined>;
	modal(body: ModalCreateBodyRequest, options: ModalCreateOptions): Promise<ModalSubmitInteraction | null>;
	modal(body: ModalCreateBodyRequest, options?: ModalCreateOptions | undefined) {
		if (options === undefined) return this.interaction.modal(body);
		return this.interaction.modal(body, options);
	}

	deferReply<WR extends boolean = false>(
		ephemeral = false,
		withResponse?: WR,
	): Promise<When<WR, WebhookMessageStructure, undefined>> {
		return this.interaction.deferReply<WR>(ephemeral ? MessageFlags.Ephemeral : undefined, withResponse);
	}

	editResponse(body: InteractionMessageUpdateBodyRequest): Promise<WebhookMessageStructure> {
		return this.interaction.editResponse(body);
	}

	deleteResponse() {
		return this.interaction.deleteResponse();
	}

	editOrReply<WR extends boolean = false>(
		body: InteractionCreateBodyRequest | InteractionMessageUpdateBodyRequest,
		withResponse?: WR,
	): Promise<When<WR, WebhookMessageStructure, void>> {
		return this.interaction.editOrReply<WR>(body as InteractionCreateBodyRequest, withResponse);
	}

	followup(body: MessageWebhookCreateBodyRequest): Promise<WebhookMessageStructure> {
		return this.interaction.followup(body);
	}

	fetchResponse(): Promise<WebhookMessageStructure> {
		return this.interaction.fetchResponse();
	}

	channel(mode?: 'rest' | 'flow'): Promise<AllChannels>;
	channel(mode: 'cache'): ReturnCache<AllChannels>;
	channel(mode: 'cache' | 'rest' | 'flow' = 'flow') {
		if (mode === 'cache')
			return this.client.cache.adapter.isAsync ? Promise.resolve(this.interaction.channel) : this.interaction.channel;
		return this.client.channels.fetch(this.channelId, mode === 'rest');
	}

	me(mode?: 'rest' | 'flow'): Promise<GuildMemberStructure | undefined>;
	me(mode: 'cache'): ReturnCache<GuildMemberStructure | undefined>;
	me(mode: 'cache' | 'rest' | 'flow' = 'flow') {
		if (!this.guildId)
			return mode === 'cache' ? (this.client.cache.adapter.isAsync ? Promise.resolve() : undefined) : Promise.resolve();
		switch (mode) {
			case 'cache':
				return (
					this.client.cache.members?.get(this.client.botId, this.guildId) ||
					(this.client.cache.adapter.isAsync ? (Promise.resolve() as any) : undefined)
				);
			default:
				return this.client.members.fetch(this.guildId, this.client.botId, mode === 'rest');
		}
	}

	guild(mode?: 'rest' | 'flow', query?: RESTGetAPIGuildQuery): Promise<GuildStructure<'cached' | 'api'> | undefined>;
	guild(mode: 'cache', query?: RESTGetAPIGuildQuery): ReturnCache<GuildStructure<'cached'> | undefined>;
	guild(mode: 'cache' | 'rest' | 'flow' = 'flow', query?: RESTGetAPIGuildQuery) {
		if (!this.guildId)
			return mode === 'cache' ? (this.client.cache.adapter.isAsync ? Promise.resolve() : undefined) : Promise.resolve();
		switch (mode) {
			case 'cache':
				return (
					this.client.cache.guilds?.get(this.guildId) ||
					(this.client.cache.adapter.isAsync ? (Promise.resolve() as any) : undefined)
				);
			default:
				return this.client.guilds.fetch(this.guildId, { force: mode === 'rest', query });
		}
	}

	get guildId() {
		return this.interaction.guildId;
	}

	get channelId() {
		return this.interaction.channel.id;
	}

	get author(): UserStructure {
		return this.interaction.user;
	}

	get member(): InteractionGuildMemberStructure | undefined {
		return this.interaction.member;
	}

	isEntryPoint(): this is EntryPointContext<M> {
		return true;
	}

	inGuild(): this is GuildEntryPointContext<M> {
		return !!this.guildId;
	}
}

export interface GuildEntryPointContext<M extends keyof RegisteredMiddlewares = never>
	extends Omit<MakeRequired<EntryPointContext<M>, 'guildId' | 'member'>, 'guild' | 'me'> {
	guild(mode?: 'rest' | 'flow'): Promise<GuildStructure<'cached' | 'api'>>;
	guild(mode: 'cache'): ReturnCache<GuildStructure<'cached'> | undefined>;

	me(mode?: 'rest' | 'flow'): Promise<GuildMemberStructure>;
	me(mode: 'cache'): ReturnCache<GuildMemberStructure | undefined>;
}
