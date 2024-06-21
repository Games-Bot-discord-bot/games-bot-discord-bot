const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, PermissionsBitField } = require("discord.js");
const fs = require('fs');
const path = require('path');

const schemaNames = fs.readdirSync(path.join(__dirname, '../../schemas'))
    .filter(file => file.endsWith('.js'))
    .map(file => file.slice(0, -3)); 

const choices = schemaNames.map(name => ({ name, value: name }));

const commandData = new SlashCommandBuilder()
    .setName('wipe-user-data')
    .setDescription('Clears a user\'s data from a specified schema.')
    .addUserOption(option => option.setName('user').setDescription('The user to clear the data for.').setRequired(true))
    .addStringOption(option => option.setName('schema').setDescription('The schema to clear the data from.').setRequired(true).addChoices(...choices))
    
module.exports = {
    data: commandData,
    async execute(interaction, client) {
        const user = interaction.options.getUser("user");
        const guild = interaction.guild.id;
        const schemaName = interaction.options.getString("schema");

        if (interaction.user.id !== '701145215888523276') return await interaction.reply({ content: 'only developers can run this command!', ephemeral: true })
    
        try {
            const schema = require(`../../schemas/${schemaName}`);
            const deletedData = await schema.findOneAndDelete({
                Guild: guild,
                UserId: user.id,
            });
    
            if (deletedData) {

                const schemaEmbed = new EmbedBuilder()
                .setColor('Red')
                .setAuthor({ name: `Schema Wipe`})
                .setTitle(`${client.user.username} Schema Wipe`)
                .setDescription(`> Successfully wiped data for user **${user.tag}** from the \`${schemaName}\` schema.`)
                .setFooter({ text: `Schema Wipe`})
                .setThumbnail(client.user.avatarURL())
                .setTimestamp();

                interaction.reply({ embeds: [schemaEmbed], ephemeral: true });
            } else {
                interaction.reply({ content: `No data found for user ${user.tag} in the ${schemaName} schema.`, ephemeral: true });
            }
        } catch (error) {
            console.log("[SCHEMAS_WIPE] Error wiping user data:", error);
            interaction.reply({ content: "An error occurred while wiping user data.", ephemeral: true });
        }
    },
};