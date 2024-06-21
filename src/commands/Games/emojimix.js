const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const superagent = require('superagent');
const onlyEmoji = require('emoji-aware').onlyEmoji;

module.exports = {
    data: new SlashCommandBuilder()
    .setName('emojimixer')
    .setDescription('combine two different emojis')
    .addStringOption(option => option.setName('emoji').setDescription('the emojis you want to combine').setRequired(true)),
    async execute (interaction) {

        await interaction.deferReply({ ephemeral: true });

        const { options } = interaction;
        const eString = options.getString('emoji');
        const input = onlyEmoji(eString);
        const response = `One or both of these emojis (\`${eString}\`) are not supported. keep in mind that gestures (ie. thumbsup) and custom server emojis are not supported as well.`;

        const output = await superagent.get('https://tenor.googleapis.com/v2/featured')
        .query({
            key: process.env.tenorapi,
            contentfilter: "high",
            media_filter: "png_transparent",
            component: 'proactive',
            collection: 'emoji_kitchen_v5',
            q: input.join('_')
        }).catch(err => {});

        if (!output) {
            return await interaction.editReply({ content: response });
        } else if (!output.body.results[0]) {
            return await interaction.editReply({ content: response });
        } else if (eString.startsWith('<') || eString.endsWith('>')) {
            return await interaction.editReply({ content: response });
        }

        const embed = new EmbedBuilder()
        .setColor('Blurple')
        .setImage(output.body.results[0].url)

        await interaction.editReply({ embeds: [embed] })
    }
}