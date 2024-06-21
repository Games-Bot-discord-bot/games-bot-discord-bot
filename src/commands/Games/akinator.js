const { SlashCommandBuilder, SlashCommandStringOption, ActivityType, EmbedBuilder } = require('discord.js')
const Akinator = require('../../akinator')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('akinator')
        .setDescription('Akinator Game! 🧞')
        .addStringOption(new SlashCommandStringOption()
            .setName('language')
            .setDescription('Select the language you prefer. (default: English)')
            .setChoices({
                name: 'English',
                value: 'en'
            }, {
                name: 'Arabic',
                value: 'ar'
            }, {
                name: 'Spanish',
                value: 'es'
            }, {
                name: 'French',
                value: 'fr'
            }, {
                name: 'Italian',
                value: 'it'
            }, {
                name: 'Japanese',
                value: 'jp'
            }, {
                name: 'Russian',
                value: 'ru'
            }, {
                name: 'Portuguese',
                value: 'pt'
            }, {
                name: 'Turkish',
                value: 'tr'
            }, {
                name: 'Chinese',
                value: 'cn'
            })
            .setRequired(false)
        ),
    async execute (interaction, client) {
        await interaction.deferReply()

        const language = interaction.options.getString('language', false) || 'en'
        const game = new Akinator(language)

        await game.start()
        await interaction.editReply({
            components: [game.component],
            embeds: [game.embed]
        })

        const filter = i => i.user.id === interaction.user.id && i.channelId === interaction.channelId
        const channel = await interaction.client.channels.fetch(interaction.channelId, { force: false })

        while (!game.ended) try {
            await game.ask(channel, filter)
            if (!game.ended) await interaction.editReply({ embeds: [game.embed], components: [game.component] })
        } catch (err) {
            if (err instanceof Error) console.error(err)
            return await interaction.editReply({
                components: [],
                embeds: [],
                content: 'Timeout.'
            })
        }
        await game.stop()

        const msg = await interaction.editReply({ components: [game.component], embeds: [game.embed] })
        const embed = new EmbedBuilder(msg.embeds[0].toJSON())

        try {
            const response = await msg.awaitMessageComponent({
                filter: i => ['yes', 'no'].includes(i.customId) && i.user.id === interaction.user.id,
                time: 30_000
            })

            const title = response.customId === 'yes'
                ? 'Awesome! Thanks for playing'
                : 'GG!'

            await msg.edit({
                components: [],
                embeds: [embed.setTitle(title)]
            })
        } catch {
            await msg.edit({
                components: [],
                embeds: [embed.setTitle(null)]
            }).catch(() => null)
        }
    }
}