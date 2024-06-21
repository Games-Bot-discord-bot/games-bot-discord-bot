const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const counting = require('../../schemas/countingschema');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('counting')
    .setDescription(`Manage your counting system`)
    .addSubcommand(command => command.setName('setup').setDescription('setup the counting system').addChannelOption(option => option.setName('channel').setDescription('the channel for the counting system').addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand(command => command.setName('disable').setDescription('disable the counting system')),
    async execute (interaction) {

        const { options } = interaction;
        const sub = options.getSubcommand()
        const data = await counting.findOne({ Guild: interaction.guild.id});

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return await interaction.reply({ content: `You must need the \`ManageGuild\` Permission to run this command!`, ephemeral: true })

        switch (sub) {
            case 'setup':

            if (data) {
                return await interaction.reply({ content: `You have already setup the counting system here`, ephemeral: true })
            } else {
                const channel = interaction.options.getChannel('channel');
                await counting.create({
                    Guild: interaction.guild.id,
                    Channel: channel.id,
                    Number: 1
                });

                const embed = new EmbedBuilder()
                .setColor('Blurple')
                .setDescription(`The Counting system has been setup! Got to ${channel} and start at 1!`)

                await interaction.reply({ embeds: [embed], ephemeral: true })
            }

            break;
            case 'disable':

            if (!data) {
                return await interaction.reply({ content: `You didnt setup a counting system here.`, ephemeral: true })
            } else {
                await counting.deleteOne({
                    Guild: interaction.guild.id,
                });

                const embed = new EmbedBuilder()
                .setColor('Blurple')
                .setDescription(`The counting system has been disabled for this server!`)

                await interaction.reply({ embeds: [embed], ephemeral: true })
            }
        }
    }
}