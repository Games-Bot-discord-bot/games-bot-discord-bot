const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, Permissions, MessageManager, Embed, Collection, Events, Partials, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, User } = require(`discord.js`);
const fs = require('fs');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMembers] }); 
const { CaptchaGenerator } = require('captcha-canvas');

client.commands = new Collection();

require('dotenv').config();

client.on('ready', () => {
    client.user.setPresence({ activities: [{ name: '/commands' }], status: 'dnd' })
})

const functions = fs.readdirSync("./src/functions").filter(file => file.endsWith(".js"));
const eventFiles = fs.readdirSync("./src/events").filter(file => file.endsWith(".js"));
const commandFolders = fs.readdirSync("./src/commands");

(async () => {
    for (file of functions) {
        require(`./functions/${file}`)(client);
    }
    client.handleEvents(eventFiles, "./src/events");
    client.handleCommands(commandFolders, "./src/commands");
    client.login(process.env.token)
})();
const counting = require('./schemas/countingschema');
client.on(Events.MessageCreate, async message => {
    if (!message.guild) return;
    if (message.author.bot) return;

    const data = await counting.findOne({ Guild: message.guild.id });
    if (!data) return
    else {

        if (message.channel.id !== data.Channel) return;

        const number = Number(message.content);
        
        if (number !== data.Number) {
            return message.react('❌');
        } else if (data.LastUser === message.author.id) {
            message.react('❌')
            await message.reply(`❌ Someone else has to count that number!`);
        } else {
            await message.react('✅');

            data.LastUser = message.author.id;
            data.Number++
            await data.save()
        }
    }
})
const GiveawaysManager = require('./giveaways');
client.giveawayManager = new GiveawaysManager(client, {
    default: {
        botsCanWin: false,
        embedColor: `0000ff`,
        embedColorEnd: `0000ff`,
        reaction: `🎉`,
    },
})

// modmail
const modSchema = require('./schemas/modmail');
client.on(Events.MessageCreate, async message => {

    if (message.author.bot) return;
    const guildId = '1170114856859488307';
    const guild = client.guilds.cache.get(guildId);

    if (message.channel.type === ChannelType.DM) {

        const member = message.author;

        modSchema.findOne({ Guild: guild.id, User: member.id }, async (err, data) => {

            if (err) throw err;

            if (!data) {
                modSchema.create({
                    Guild: guild.id,
                    User: member.id
                })
            };

            if (data) {
                modSchema.create({
                    Guild: guild.id,
                    User: member.id
                })
            };

    
        })

        if (message.attachments.size > 0) {
            message.react('❌');
            return member.send('I cannot send this message!')
        }

        const posChannel = guild.channels.cache.find(c => c.name === `${message.author.id}`);

        if (posChannel) {

            const embed = new EmbedBuilder()
            .setColor('Blue')
            .setAuthor({ name: `${message.author.username}`, iconURL: `${message.author.displayAvatarURL()}`})
            .setDescription(message.content)

            posChannel.send({ embeds: [embed] });
            message.react('📧')
            return;
        }

        const category = guild.channels.cache.get('1170114857639620729');
        const channel = await guild.channels.create({
            name: `${message.author.username}'s ticket`,
            type: ChannelType.GuildText,
            parent: category,
            topic: `A ticket created by ${message.author.tag}`
        });

        member.send(`Your created successfully a ticket in ${guild.name}!`).catch(err => {
            return;
        });

        const embed = new EmbedBuilder()
        .setTitle('NEW TICKET')
        .setColor('Green')
        .setAuthor({ name: `${message.author.username}`, iconURL: `${message.author.displayAvatarURL()}`})
        .setDescription(message.content)
        .setTimestamp()
        .setFooter({ text: "Use the button down below to close this ticket" })

        const button = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId('button')
            .setStyle(ButtonStyle.Danger)
            .setLabel('close')
            .setEmoji('🔐')
        );

        const m = await channel.send({ embeds: [embed], components: [button] });

        const collector = m.createMessageComponentCollector()

        collector.on('collect', async i => {
            if (i.customId === 'button') {
                await channel.delete()
                member.send(`Your ticket conversitation in ${guild.name} has been closed by a moderator!`)
            }
        })

        m.pin();
        message.react('📧')
    }
})

client.on(Events.MessageCreate, async message => {

    if (message.channel.type === ChannelType.GuildText) {

        const guildId = '1170114856859488307';
        const guild = client.guilds.cache.get(guildId);

        modSchema.findOne({ Guild: guild.id, User: message.channel.name}, async (err, data) => {

            if (data == null) return;
            const colChannel = guild.channels.cache.find(c => c.name === `${data.User}`);

            if (message.channel === colChannel) {

                const memberId = data.User;
                const member = await client.user.fetch(memberId);

                if (message.attachments.size > 0) {
                    message.react('❌');
                    return member.send('I cannot send this message!')
                }

                message.react('📧')

                const embed = new EmbedBuilder()
                .setColor('Blue')
                .setAuthor({ name: `${message.author.username}`, iconURL: `${message.author.displayAvatarURL()}`})
                .setDescription(message.content)

                member.send({ embeds: [embed] })
            }
        })
    }
})
const capschema = require('./schemas/verify'); // your schema path
const verifyusers = require('./schemas/verifyusers'); // your schema path
const LeftUsers = require('./schemas/leftusers'); // your schema path
 
    client.on(Events.InteractionCreate, async interaction => {
        try {

        if (interaction.customId === 'verify') {
 
        if (interaction.guild === null) return;
     
        const verifydata = await capschema.findOne({ Guild: interaction.guild.id });
        const verifyusersdata = await verifyusers.findOne({ Guild: interaction.guild.id, User: interaction.user.id });
     
            if (!verifydata) return await interaction.reply({ content: `The **verification system** has been disabled in this server!`, ephemeral: true});
     
            if (verifydata.Verified.includes(interaction.user.id)) return await interaction.reply({ content: 'You have **already** been verified!', ephemeral: true});
     
                let letter = ['0','1','2','3','4','5','6','7','8','9','a','A','b','B','c','C','d','D','e','E','f','F','g','G','h','H','i','I','j','J','f','F','l','L','m','M','n','N','o','O','p','P','q','Q','r','R','s','S','t','T','u','U','v','V','w','W','x','X','y','Y','z','Z',]
                let result = Math.floor(Math.random() * letter.length);
                let result2 = Math.floor(Math.random() * letter.length);
                let result3 = Math.floor(Math.random() * letter.length);
                let result4 = Math.floor(Math.random() * letter.length);
                let result5 = Math.floor(Math.random() * letter.length);
     
                const cap = letter[result] + letter[result2] + letter[result3] + letter[result4] + letter[result5];
     
                const captcha = new CaptchaGenerator()
                .setDimension(150, 450)
                .setCaptcha({ text: `${cap}`, size: 60, color: "red"})
                .setDecoy({ opacity: 0.5 })
                .setTrace({ color: "red" })
     
                const buffer = captcha.generateSync();
     
                const verifyattachment = new AttachmentBuilder(buffer, { name: `captcha.png`});
     
                const verifyembed = new EmbedBuilder()
                .setColor('Green')
                .setAuthor({ name: `✅ Verification Proccess`})
                .setFooter({ text: `✅ Verification Captcha`})
                .setTimestamp()
                .setImage('attachment://captcha.png')
                .setThumbnail('https://www.kindpng.com/picc/m/68-687017_green-tick-transparent-background-clipart-free-to-use.png')
                .setTitle('> Verification Step: Captcha')
                .addFields({ name: `• Verify`, value: '> Please use the button bellow to \n> submit your captcha!'})
     
                const verifybutton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                    .setLabel('✅ Enter Captcha')
                    .setStyle(ButtonStyle.Success)
                    .setCustomId('captchaenter')
                )

                await interaction.reply({ embeds: [verifyembed], components: [verifybutton], files: [verifyattachment], ephemeral: true });
     
                if (verifyusersdata) {
     
                    await verifyusers.deleteMany({
                        Guild: interaction.guild.id,
                        User: interaction.user.id
                    })
     
                    await verifyusers.create ({
                        Guild: interaction.guild.id,
                        User: interaction.user.id,
                        Key: cap
                    })
     
                } else {
     
                    await verifyusers.create ({
                        Guild: interaction.guild.id,
                        User: interaction.user.id,
                        Key: cap
                    })
     
                }
            }
            } catch (err) {
                console.error(err)
            }
             
        
    });

    client.on(Events.InteractionCreate, async interaction => {
        if (interaction.customId === 'captchaenter') {
            const vermodal = new ModalBuilder()
                .setTitle(`Verification`)
                .setCustomId('vermodal')
     
                const answer = new TextInputBuilder()
                .setCustomId('answer')
                .setRequired(true)
                .setLabel('• Please sumbit your Captcha code')
                .setPlaceholder(`Your captcha code input`)
                .setStyle(TextInputStyle.Short)
     
                const vermodalrow = new ActionRowBuilder().addComponents(answer);
                vermodal.addComponents(vermodalrow);

            await interaction.showModal(vermodal);
        }
    });
     
    client.on(Events.InteractionCreate, async interaction => {
     try {
        if (!interaction.isModalSubmit()) return;
     
        if (interaction.customId === 'vermodal') {
     
            const userverdata = await verifyusers.findOne({ Guild: interaction.guild.id, User: interaction.user.id });
            const verificationdata = await capschema.findOne({ Guild: interaction.guild.id });
     
            if (verificationdata.Verified.includes(interaction.user.id)) return await interaction.reply({ content: `You have **already** verified within this server!`, ephemeral: true});
     
            const modalanswer = interaction.fields.getTextInputValue('answer');
            if (modalanswer === userverdata.Key) {
     
                const verrole = await interaction.guild.roles.cache.get(verificationdata.Role);
     
                try {
                    await interaction.member.roles.add(verrole);
                } catch (err) {
                    return await interaction.reply({ content: `There was an **issue** giving you the **<@&${verificationdata.Role}>** role, try again later!`, ephemeral: true})
                }
     
                await interaction.reply({ content: 'You have been **verified!**', ephemeral: true});
                await capschema.updateOne({ Guild: interaction.guild.id }, { $push: { Verified: interaction.user.id }});
     
            } else {
                await interaction.reply({ content: `**Oops!** It looks like you **didn't** enter the valid **captcha code**!`, ephemeral: true})
            }
        }
        } catch (err) {
            console.error(err)
        }
        
        
    });

    // When a user leaves the server, save their data in a "LeftUsers" collection or with a flag.
client.on('guildMemberRemove', async member => {
    try {
        const userId = member.user.id;
        
        // Check if the user was verified
        const verifyusersdata = await verifyusers.findOne({ Guild: member.guild.id, User: userId });
        if (verifyusersdata) {
            // Save their data in the LeftUsers collection or add a "left" flag
            await LeftUsers.create({
                Guild: member.guild.id,
                User: userId,
                Key: verifyusersdata.Key,
                Left: true, // You can add a "left" flag here
            });
        }
    } catch (err) {
        console.error(err);
    }
});

    client.on('guildMemberAdd', async member => {
        try {
        const userId = member.user.id;

        // Check if the user has left data in the LeftUsers collection or has a "left" flag
        const leftUserData = await LeftUsers.findOne({ Guild: member.guild.id, User: userId });

        if (leftUserData) {
            // Re-assign the verified role
            const verificationdata = await capschema.findOne({ Guild: member.guild.id });
            const verrole = await member.guild.roles.cache.get(verificationdata.Role);
            await member.roles.add(verrole);
            await LeftUsers.deleteOne({ Guild: member.guild.id, User: userId });
        }
        } catch (err) {
            console.error(err);
        }
});