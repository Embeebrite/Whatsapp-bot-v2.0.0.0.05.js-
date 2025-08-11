require('dotenv').config();
const { Client, LocalAuth, List } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const Sentiment = require('sentiment');
const quizQuestions = [
    {
        question: "What does HTML stand for?",
        options: [
            "Hyper Trainer Marking Language",
            "Hyper Text Marketing Language",
            "Hyper Text Markup Language",
            "Hyper Text Markup Leveler"
        ],
        correct: 2,
        category: "Programming"
    },
    {
        question: "Which programming language is known as the 'language of the web'?",
        options: ["Python", "Java", "JavaScript", "C++"],
        correct: 2,
        category: "Programming"
    },
    {
        question: "Which of these is NOT a JavaScript framework?",
        options: ["React", "Angular", "Django", "Vue"],
        correct: 2,
        category: "Programming"
    },
    {
        question: "What does CSS stand for?",
        options: [
            "Computer Style Sheets",
            "Creative Style System",
            "Cascading Style Sheets",
            "Colorful Style Sheets"
        ],
        correct: 2,
        category: "Programming"
    },
    {
        question: "Which of these is a Python web framework?",
        options: ["Spring", "Laravel", "Django", "Ruby on Rails"],
        correct: 2,
        category: "Programming"
    },
    {
        question: "What is the first book of the Bible?",
        options: ["Exodus", "Genesis", "Matthew", "Psalms"],
        correct: 1,
        category: "Bible"
    },
    {
        question: "Who wrote most of the New Testament letters?",
        options: ["Peter", "John", "Paul", "James"],
        correct: 2,
        category: "Bible"
    },
    {
        question: "How many books are in the New Testament?",
        options: ["27", "39", "66", "12"],
        correct: 0,
        category: "Bible"
    },
    {
        question: "Which author wrote 'Atomic Habits'?",
        options: ["Dale Carnegie", "James Clear", "Mark Manson", "Brene Brown"],
        correct: 1,
        category: "Self-Help"
    },
    {
        question: "What concept does 'The 4-Hour Workweek' promote?",
        options: [
            "Early retirement",
            "Minimalism",
            "Lifestyle design",
            "Stock market investing"
        ],
        correct: 2,
        category: "Self-Help"
    }
];

const PAYMENT_NUMBER = process.env.PAYMENT_NUMBER || '0782040755';
const ADMIN_NUMBER = '263782040755@c.us';

// E-Books Categories and Lists
const ebookCategories= {
    "Programming Books (Python)": [
        "The Recursive Book of Recursion Ace the Coding Interview",
        "Dive Into Algorithms A Pythonic Adventure for the Intrepid Beginner",
        "Python Cookbook (David Beazley, Brian K. Jones)",
        "Python Crash Course, 3rd Edition A Hands-On, Project-Based Introduction to Programming",
        "Python Flash Cards - Syntax, Concepts, and Examples",
        "Learning Python, 5th Edition (Mark Lutz)",
        "Object-Oriented Python (Irv Kalb)",
        "Beyond the Basic Stuff with Python Best Practices and Tools for Writing Clean, Readable Code",
        "The Big Book of Small Python Projects 81 Easy-to-Do Projects",
        "Python Tricks - A Buffet of Awesome Python Features",
        "Fluent Python Clear, Concise, and Effective Programming",
        "Automate the Boring Stuff with Python, 2nd Edition"
    ],
    
    "Bible Commentary": [
        "Jamieson, Fausset, and Browns Commentary on the Whole Bible",
        "Believers Bible Commentary (William MacDonald)",
        "The New Matthew Henry Commentary Complete and Unabridged",
        "The Expositors Bible Commentary - Abridged Edition",
        "The Wycliffe Bible Commentary, Phrase by Phrase, Verse by Verse",
        "The Moody Bible Commentary (Michael A Rydelnik)",
        "The MacArthur Bible Commentary Unleashing the Truth of God's Word"
    ],
    
    "Self-Help Books": [
        "Never Split the Difference Negotiating As If Your Life Depended On It",
        "The 48 laws of power (Robert Greene Joost Elffers)",
        "Models.pdf",
        "The Let Them Theory + A Life-Changing Tool to Help You Let Go, Move On, and Live a Happier Life",
        "How to Win Friends and Influence People (Dale Carnegie)",
        "Sophies World A Novel about the History of Philosophy",
        "Metamorphoses (Ovid Bernard Knox Charles Martin)",
        "You Can Heal your Life (Louise L. Hay)",
        "The 8th Habit (Stephen R. Covey)",
        "Deep Work Rules for Focused Success in a Distracted World (Cal Newport)",
        "Untamed (Palmer Diana)",
        "The Power of Habit 7 Steps to Successful Habits",
        "The Four Agreements_Toltec_W.pdf",
        "The_alchemist.epub",
        "Atomic_Habits_-_Tiny_changes_remarkable_results.epub",
        "Atomic_Habits_-_James_Clear.epub",
        "THINK AND GROW RICH.pdf",
        "Rich Dad, Poor Dad What the Rich Teach Their Kids About Money-That the Poor and Middle Class Do Not!",
        "Models_Attract Women Through Honesty - Mark Manson.epub",
        "Models_Attract Women Through Honesty - Mark Manson.pdf",
        "21 Irrefutable Laws of Leadership - John C Maxwell.pdf",
        "As_a_Man_Thinketh-James_Allen.epub",
        "As_a_Man_Thinketh-James_Allen.pdf",
        "Think_and_grow_rich_-copy(1).pdf",
        "Mans Search For Meaning (Viktor Emil Frankl)",
        "The Power of Positive Thinking (Norman Vincent Peale)",
        "Awaken the Giant Within How to Take Immediate Control of Your Mental, Emotional, Physical and Financial Destiny! (Anthony Robbins)",
        "The Power of Now (Eckhart Tolle, Eckhart Tolle)",
        "THE-ALCHEMIST-pdf-free-download.pdf",
        "The_Art_of_Being_ALONE_Solitude_is_240211_2.pdf",
        "Eat_That_Frog!_21_Great_Ways_to_Stop_Procrastinating_and_Get_More_Done_in_Less_Time.epub",
        "You-Are-a-Badass-How-to-Stop-Doubting-Your-Greatness-and-Start-Living-an-Awesome-Life.epub",
        "You-Are-a-Badass-How-to-Stop-Doubting-Your-Greatness-and-Start-Living-an-Awesome-Life.pdf",
        "Outliers_The Story Of Success (Gladwell Malcolm)",
        "The Secret (Rhonda Byrne)",
        "The Gifts of Imperfection Let Go of Who You Think You're Supposed to Be and Embrace Who You Are (Brene Brown)",
        "The 4-Hour Workweek (Ferriss Timothy)",
        "Daring Greatly How the Courage to Be Vulnerable Transforms the Way We Live, Love, Parent, and Lead (Brene Brown)",
        "Meditations (Marcus Aurelius, Translated by Gregory Hays)",
        "Who Moved My Cheese (Spencer Johnson Blair)",
        "THE MAGIC OF THINKING BIG (David J Schwartz)",
        "Power of Positive Thinking by Noman V Peale (Norman Vincent Peale)"
    ]
};

let db = {
    users: {},
    groups: {},
    orders: {},
    coupons: { WELCOME10: { discount: 10, validUntil: '2025-09-30' } },
    settings: {},
    stats: {},
    suggestions: {}
     Quizzes: {}
};
// Load database
try {
    const dbData = fs.readFileSync('db.json', 'utf8');
    if (dbData) Object.assign(db, JSON.parse(dbData));
} catch (e) {
    fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
}
const groupFeatures = {
    slowMode: {},
    mutedGroups: {},
    nightMode: {},
    welcomeMessages: {},
    autoRules: {},
    roleSystem: {},
    suggestionBox: {}
};

// Bad words filter
const badWords = [
    // ... [Your full badWords array here, unchanged]
    "fuck", "shit", "bitch", "asshole", // etc
    "sokhova", "igqiza", "fuck", "shit", "bitch", "asshole", "wtf", "damn", "crap",
 "f\\ck", "sh\\t", "b\\tch", "a\\shole",
 // English common curse words & variants (with masking)
 "fuck", "fck", "fk", "f", "shit", "sht", "sh", "bitch", "btch", "bch", "asshole", "ahole", "a", "damn", "dammit", "crap",
 "dick", "dck", "dk", "piss", "pss", "p", "cunt", "cnt", "cock", "cck", "bastard", "bstard", "bollocks", "bugger", "arse", "ass",
 "twat", "wanker", "prick", "slut", "whore", "skank", "cum", "jerk", "douche", "douchebag", "douche-bag", "motherfucker", "mother-fucker",
 "motherfuker", "nigger", "nigga", "faggot", "fag", "retard", "spastic", "wop", "kike", "chink", "gook", "coon", "beaner", "wetback",
 "paki", "raghead", "towelhead", "sandnigger", "honky", "cracker", "redneck", "chode", "dipshit", "dumbass", "dumbasshole", "asshat", "asshole",
 "shithead", "shitface", "fuckface", "fuckhead", "cumdumpster", "cumguzzler", "asslicker", "asslick", "asswipe", "clit", "clitface", "clitlicker",
 "cockface", "cockmonger", "cocksmoker", "cocksucker", "cocksuck", "cuntface", "dickface", "dickhead", "dicklicker", "dickweed", "dickwad",
 "dildo", "douchecanoe", "douchebag", "fartknocker", "fartsmeller", "fucktard", "fuckwit", "handjob", "jerkoff", "jizz", "knobhead", "motherfucker",
 "muffdiver", "pussy", "pussylicker", "pussylick", "shitstain", "shitstick", "skank", "twatwaffle", "titfuck", "tits", "tosser", "twatwaffle",
 "wank", "wankstain", "wanksta", "wankz", "whoreface", "whorehouse", "bitchass", "bollocks", "pussy", "shit", "twat", "blowjob", "cumshot",
 "fellatio", "handjob", "rimjob",

  // Common internet slang & acronyms
  "wtf", "stfu", "fml", "lmao", "lmfao", "idgaf", "brb", "gtfo", "nvm", "smh", "ffs", "af",

  // Add common variations with stars and spacing (simple examples)
  "f u c k", "s h i t", "b i t c h", "a s s h o l e", "m o t h e r f u c k e r",

  // More slang (to expand)
  "slut", "hoe", "tramp", "whore", "skank", "slag", "bimbo", "cum", "dickhead", "dickweed", "prick", "tosser", "wanker", "knobhead", "bollocks",

  // Common insults (non-cursing but offensive)
  "stupid", "idiot", "moron", "dumb", "retard", "loser", "jerk", "freak", "loser", "twat", "twatwaffle",

  // Extended filler vulgar words & slangs
  "blowjob", "rimjob", "handjob", "titfuck", "pussylicker", "cockmonger", "cocksmoker", "cumdumpster", "fucktard", "fuckwit", "shitface",
"fuck","f*ck","f**k","f***","shit","sh*t","sh**","bitch","b*tch","b**ch","asshole","a**hole","a**","damn","dammit","crap","dick","d*ck","d**k",
  "piss","p*ss","p***","cunt","c*nt","cock","c*ck","bastard","b*stard","bollocks","bugger","arse","ass","twat","wanker","prick","slut","whore","skank",
  "cum","jerk","douche","douchebag","motherfucker","mother-fucker","motherfuker","nigger","nigga","faggot","fag","retard","spastic","wop","kike","chink",
  "gook","coon","beaner","wetback","paki","raghead","towelhead","sandnigger","honky","cracker","redneck","chode","dipshit","dumbass","dumbasshole",
  "asshat","shithead","shitface","fuckface","fuckhead","cumdumpster","cumguzzler","asslicker","asslick","asswipe","clit","clitface","clitlicker","cockface",
  "cockmonger","cocksmoker","cocksucker","cocksuck","cuntface","dickface","dickhead","dicklicker","dickweed","dickwad","dildo","douchecanoe","fartknocker",
  "fartsmeller","fucktard","fuckwit","handjob","jerkoff","jizz","knobhead","muffdiver","pussy","pussylicker","pussylick","shitstain","shitstick","twatwaffle",
  "titfuck","tits","tosser","wank","wankstain","wanksta","wankz","whoreface","whorehouse","bitchass","blowjob","cumshot","fellatio","rimjob","slutbag",
  "shitface","assbag","clunge","gash","mung","minger","berk","wazzock","prat","divvy","plonker","pillock","twit","tosspot","muppet","nob","nobhead",
  "plonker","git","numpty","wally","twitface","knobend","pillock","twonk","arsehole","shithead","bollocks","bugger","prick","twat","sod","tosser","wanker",
  "bellend","minger","bint","chav","minge","shag","knob","slag","bint","numpty","prat","pillock","git","berk","wazzock","numpty","knobhead","prick",
  "tosser","git","gobshite","shite","sod","feck","eejit","eejitface","chancer","yob","yobbo","numpty","daft","daftcow","plonker","muppet","twit","pillock",
  "berk","wazzock","twonk","knobhead","prat","tosser","bint","slag","git","nobhead","numpty","gobshite","wanker","twat","prick","bollocks","knob","feck",
  "sod","shite","fecker","gobshite","eejit","eejitface","daft","daftcow","numpty","dafty"
  // Add more as you find or need
  // You can keep adding more over time
  "sokhova", "igqiza"
];
const badWordsPattern = badWords.join("|");
const badWordsRegex = new RegExp(`\\b(${badWordsPattern})\\b`, "i");

const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-z0-9-]+\.[a-z]{2,}(\/[^\s]*)?)/gi;
const lastMessageTimestamps = {};
const dmContexts = {};

function sentimentAnalysis(text) {
    const analyzer = new Sentiment();
    return analyzer.analyze(text).score;
}

// WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true, args: [] }
});

// QR code
client.on('qr', qr => qrcode.generate(qr, { small: true }));
client.on('ready', () => {
    console.log('✅ Bot Ready!');
    initScheduledTasks();
});
client.on('disconnected', reason => {
    console.log('❌ Disconnected:', reason);
    backupDatabase();
});
client.on('auth_failure', msg => console.error('AUTH FAILURE:', msg));
client.on('authenticated', () => console.log('✅ Authenticated'));

// ===================
// GROUP JOIN/LEAVE
// ===================
client.on('group_join', async notification => {
    const chatId = notification.chatId;
    const group = db.groups[chatId] || {};

    if (group.welcomeEnabled) {
        const user = notification.recipientIds[0];
        const welcomeMsg = group.welcomeMessage
            ? group.welcomeMessage.replace('{user}', `@${user.split('@')[0]}`).replace('{group}', group.name || 'this group')
            : `👋 Welcome @${user.split('@')[0]} to the group!`;

        await client.sendMessage(chatId, welcomeMsg, { mentions: [user] });
        if (group.autoRole) {
            groupFeatures.roleSystem[user] = group.autoRole;
            db.users[user] = db.users[user] || {};
            db.users[user].role = group.autoRole;
            await client.sendMessage(chatId, `Assigned role: ${group.autoRole} to new member!`);
        }
    }
    if (group.rulesEnabled && group.rulesContent) {
        await client.sendMessage(chatId, `📜 Group Rules:\n${group.rulesContent}`);
    }
});
client.on('group_leave', async notification => {
    const userId = notification.recipientIds[0];
    delete groupFeatures.roleSystem[userId];
});

// ===================
// MAIN MESSAGE HANDLER
// ===================
client.on('message', async msg => {
    try {
        if (!msg || msg.fromMe || !msg.body) return;
        const chat = await msg.getChat();
        const contact = await msg.getContact();
        const userId = contact.id._serialized;
        const chatId = chat.id._serialized;

        // Initialize user
        if (!db.users[userId]) {
            db.users[userId] = {
                id: userId,
                name: contact.pushname,
                xp: 0,
                level: 1,
                joined: new Date().toISOString(),
                warnings: 0
            };
        }
        // Initialize group
        if (chat.isGroup && !db.groups[chatId]) {
            db.groups[chatId] = {
                id: chatId,
                name: chat.name,
                welcomeEnabled: false,
                rulesEnabled: false
            };
        }
        // Direct message auto-reply
        if (!msg.from.includes('@g.us')) {
            const replied = await handleDirectMessageAutoReplyAdvanced(msg, msg.body, contact);
            if (replied) return;
        }
        // List response handler (for menu and ebook category selection)
        if (msg.type === 'list_response') {
            if (ebookCategories[msg.body]) {
                await client.sendMessage(
                    msg.from,
                    `📚 *${msg.body}*\n\n` + ebookCategories[msg.body].map(b => `• ${b}`).join('\n')
                );
                return;
            }
            switch (msg.selectedRowId) {
                case "cmd_buy":
                    await client.sendMessage(msg.from, "To buy a course, use `!buy <course_name>`.");
                    break;
                case "cmd_xp":
                    await client.sendMessage(msg.from, "Your XP and Level information will be here.");
                    break;
                case "cmd_suggest":
                    await client.sendMessage(msg.from, "Send your suggestion with `!suggest <your idea>`.");
                    break;
                case "cmd_mute":
                    await client.sendMessage(msg.from, "Mute group command selected (admin only).");
                    break;
                case "cmd_slow":
                    await client.sendMessage(msg.from, "Slow mode command selected (admin only).");
                    break;
                case "cmd_pay":
                    await client.sendMessage(msg.from,
                        `💰 EcoCash Payment Details:\nNumber: ${PAYMENT_NUMBER}\nName: BRIGHT MACHAWIRA`
                    );
                    break;
                default:
                    await client.sendMessage(msg.from, "Unknown selection.");
            }
            return;
        }

        // Handle admin commands
        if (userId === ADMIN_NUMBER) {
            await handleAdminCommands(msg, chat);
        }
        // Handle group features
        if (chat.isGroup) {
            await handleGroupFeatures(msg, chat, contact);
        }
        // Sentiment analysis
        const sentimentScore = sentimentAnalysis(msg.body);
        if (sentimentScore < -3) {
            await handleToxicMessage(msg, sentimentScore, userId);
        }
        // Handle commands
        if (msg.body.startsWith('!')) {
            await handleCommandSystem(msg, chat, contact);
        }
        // XP System
        updateUserXP(userId, 1);

        // Handle "!ebook" as a command (show category list)
        if (msg.body.toLowerCase() === "!ebook") {
            const sections = [{
                title: "Choose a Category",
                rows: Object.keys(ebookCategories).map(cat => ({
                    title: cat,
                    description: `View ${ebookCategories[cat].length} books`
                }))
            }];
            const list = new List(
                "Select the category you want:",
                "View Categories",
                sections,
                "📚 E-Book Library",
                "Choose"
            );
            await client.sendMessage(msg.from, list);
        }

    } catch (error) {
        console.error('Message Handling Error:', error);
    }
});

// ===================
// GROUP FEATURES
// ===================
async function handleGroupFeatures(msg, chat, contact) {
    const chatId = chat.id._serialized;
    const body = msg.body.toLowerCase();

    // Muted groups
    if (groupFeatures.mutedGroups[chatId]) {
        const participant = chat.participants.find(p => p.id._serialized === msg.author);
        if (!participant || !participant.isAdmin) {
            await msg.delete(true);
            return;
        }
    }
    // URL detection
    if (urlRegex.test(body)) {
        const participant = chat.participants.find(p => p.id._serialized === msg.author);
        if (!participant || !participant.isAdmin) {
            await msg.delete(true);
            await client.sendMessage(chatId, `⚠️ ${contact.pushname}, links are not allowed!`);
            return;
        }
    }
    // Bad words filter
    if (badWordsRegex.test(body)) {
        await msg.delete(true);
        await client.sendMessage(chatId, `⚠️ ${contact.pushname}, please avoid using offensive language!`);
        return;
    }
    // Slow mode
    if (groupFeatures.slowMode[chatId]) {
        const now = Date.now();
        const lastTimestamp = lastMessageTimestamps[msg.author] || 0;
        const slowModeInterval = groupFeatures.slowMode[chatId].interval;
        if (now - lastTimestamp < slowModeInterval) {
            await msg.delete(true);
            return;
        }
        lastMessageTimestamps[msg.author] = now;
    }
}

async function handleToxicMessage(msg, score, userId) {
    db.users[userId].warnings = (db.users[userId].warnings || 0) + 1;
    await msg.reply(`⚠️ Please keep it positive! This message was detected as negative.`);
}

// ===================
// COMMAND SYSTEM
// ===================
async function handleCommandSystem(msg, chat, contact) {
    const body = msg.body;
    const args = body.slice(1).split(/ +/);
    const command = args.shift().toLowerCase();
    const userId = contact.id._serialized;
    const chatId = chat.id._serialized;

    // Is group admin
    let isGroupAdmin = false;
    if (chat.isGroup) {
        const participant = chat.participants.find(p => p.id._serialized === userId);
        isGroupAdmin = participant && participant.isAdmin;
    }
    switch (command) {

         case 'profile':
    await handleProfileCommand(msg, contact);
    break;
case 'leaderboard':
    await handleLeaderboardCommand(msg);
    break;
case 'warn':
    await handleWarnCommand(msg, chat, contact);
    break;
case 'warned':
    await handleWarnedCommand(msg);
    break;
        case 'suggest':
            await handleSuggestion(msg);
            break;
        case 'order':
            await handleOrderCommand(msg, args);
            break;
        case 'menu':
            await sendMenu(msg);
            break;
        case 'quiz':
            await handleQuizCommand(msg);
            break;
        case 'ebooks':
            await handleEbooksCommand(msg);
            break;
        case 'buy':
            await handleBuyCommand(msg, args);
            break;
        case 'help':
            await handleHelpCommand(msg);
            break;
        case 'rules':
            await handleRulesCommand(msg, chat);
            break;
        case 'bot':
            await msg.reply('🤖 *BriteAtom Bot v2* is running smoothly!');
            break;
        case 'welcome':
            await handleWelcomeCommand(msg, chat);
            break;
        case 'kick':
            if (chat.isGroup && isGroupAdmin) await handleKickCommand(msg, chat);
            break;
        case 'slowmode':
            if (chat.isGroup && isGroupAdmin) await handleSlowModeCommand(msg, chat, args);
            break;
        case 'slowoff':
            if (chat.isGroup && isGroupAdmin) await handleSlowOffCommand(msg, chat);
            break;
        default:
            await msg.reply("Unknown command. Type !help to see available commands.");
    }
}

async function sendMenu(msg) {
    const sections = [
        {
            title: "Main Commands",
            rows: [
                { id: "cmd_buy", title: "🛒 Buy a Course", description: "Purchase available courses" },
                { id: "cmd_xp", title: "📊 Check XP & Level", description: "See your progress" },
                { id: "cmd_suggest", title: "💡 Suggest Feature", description: "Send an idea to admins" },
                { id: "cmd_pay", title: "💰 Pay via EcoCash", description: "View payment details" }
            ]
        },
        {
            title: "Group Features",
            rows: [
                { id: "cmd_mute", title: "🔇 Mute Group", description: "Silence group messages" },
                { id: "cmd_slow", title: "🐢 Enable Slow Mode", description: "Limit message frequency" }
            ]
        }
    ];
    const list = new List(
        "Choose a command from the list below:",
        "View Commands",
        sections,
        "📜 Bot Command Menu",
        "Select one"
    );
    await client.sendMessage(msg.from, list);
}

// ===================
// COMMAND HANDLERS
// ===================

// Implement quiz command handler
async function handleQuizCommand(msg) {
    const chatId = msg.from;
    
    // Check if quiz already active
    if (db.quizzes[chatId]) {
        return await msg.reply("A quiz is already in progress in this chat!");
    }
    
    // Initialize quiz
    db.quizzes[chatId] = {
        currentQuestion: 0,
        score: 0,
        questions: getRandomQuestions(5),
        participants: {}
    };
    
    // Send first question
    await sendQuizQuestion(msg, chatId);
}

function getRandomQuestions(count) {
    const shuffled = [...quizQuestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

async function sendQuizQuestion(msg, chatId) {
    const quiz = db.quizzes[chatId];
    if (!quiz || quiz.currentQuestion >= quiz.questions.length) return;
    
    const questionObj = quiz.questions[quiz.currentQuestion];
    let questionText = `📝 *Question ${quiz.currentQuestion + 1}/${quiz.questions.length}*\n`;
    questionText += `Category: ${questionObj.category}\n\n`;
    questionText += `*${questionObj.question}*\n\n`;
    
    questionObj.options.forEach((option, index) => {
        questionText += `${String.fromCharCode(65 + index)}) ${option}\n`;
    });
    
    await msg.reply(questionText);
    
    // Set timeout for question
    quiz.timeout = setTimeout(async () => {
        if (db.quizzes[chatId]?.currentQuestion === quiz.currentQuestion) {
            await msg.reply("⏰ Time's up! Moving to next question...");
            quiz.currentQuestion++;
            if (quiz.currentQuestion < quiz.questions.length) {
                await sendQuizQuestion(msg, chatId);
            } else {
                await endQuiz(msg, chatId);
            }
        }
    }, 30000); // 30 seconds per question
}

// Add to message handler (after command handling)
// Handle quiz answers
if (db.quizzes[chatId]) {
    await handleQuizAnswer(msg, chatId);
}

// Implement quiz answer handler
async function handleQuizAnswer(msg, chatId) {
    const quiz = db.quizzes[chatId];
    if (!quiz || quiz.currentQuestion >= quiz.questions.length) return;
    
    const answer = msg.body.trim().toUpperCase();
    if (!["A", "B", "C", "D"].includes(answer)) return;
    
    const userId = msg.author || msg.from;
    if (quiz.participants[userId]) return; // Already answered
    
    const questionObj = quiz.questions[quiz.currentQuestion];
    const selectedIndex = answer.charCodeAt(0) - 65;
    
    // Record participation
    quiz.participants[userId] = true;
    
    // Check answer
    const isCorrect = selectedIndex === questionObj.correct;
    if (isCorrect) {
        quiz.score++;
        
        // Update user XP
        if (!db.users[userId]) {
            db.users[userId] = {
                id: userId,
                name: (await msg.getContact()).pushname,
                xp: 0,
                level: 1
            };
        }
        db.users[userId].xp += 10;
        
        await msg.reply("✅ Correct! +10 XP");
    } else {
        const correctAnswer = String.fromCharCode(65 + questionObj.correct);
        await msg.reply(`❌ Incorrect! The correct answer was ${correctAnswer}`);
    }
    
    // Move to next question
    clearTimeout(quiz.timeout);
    quiz.currentQuestion++;
    
    if (quiz.currentQuestion < quiz.questions.length) {
        await sendQuizQuestion(msg, chatId);
    } else {
        await endQuiz(msg, chatId);
    }
}

async function endQuiz(msg, chatId) {
    const quiz = db.quizzes[chatId];
    if (!quiz) return;
    
    const participantCount = Object.keys(quiz.participants).length;
    let results = `🏁 *Quiz Finished!* 🏁\n`;
    results += `Final Score: ${quiz.score}/${quiz.questions.length}\n`;
    results += `Participants: ${participantCount}\n\n`;
    
    if (quiz.score === quiz.questions.length) {
        results += "🎉 Perfect score! Amazing job!";
    } else if (quiz.score >= quiz.questions.length * 0.7) {
        results += "👍 Great effort! You know your stuff!";
    } else {
        results += "💪 Keep learning! You'll do better next time!";
    }
    
    await msg.reply(results);
    
    // Clean up quiz
    delete db.quizzes[chatId];
}
async function handleSuggestion(msg) {
    const suggestion = msg.body.replace('!suggest', '').trim();
    if (!suggestion) return;
    const suggestionId = uuidv4().substr(0, 8);
    db.suggestions[suggestionId] = {
        text: suggestion,
        date: new Date().toISOString(),
        from: msg.from
    };
    await client.sendMessage(
        ADMIN_NUMBER,
        `📩 New Suggestion (${suggestionId}):\n${suggestion}`
    );
    await msg.reply('✅ Your suggestion was anonymously forwarded to admin!');
}

// Show user's profile, XP, level, warnings, role, join date
async function handleProfileCommand(msg, contact) {
    const userId = contact.id._serialized;
    const user = db.users[userId];
    if (!user) return msg.reply('User profile not found.');
    await msg.reply(
        `👤 *Your Profile*\n` +
        `Name: ${user.name}\n` +
        `XP: ${user.xp}\n` +
        `Level: ${user.level}\n` +
        `Joined: ${user.joined}\n` +
        `Warnings: ${user.warnings || 0}\n` +
        `Role: ${user.role || 'User'}`
    );
}

// Show leaderboard of top XP users
async function handleLeaderboardCommand(msg) {
    const topUsers = Object.values(db.users)
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 5);
    let text = "🏆 *Leaderboard*\n";
    topUsers.forEach((user, idx) => {
        text += `${idx + 1}. ${user.name} - Level ${user.level} (${user.xp} XP)\n`;
    });
    await msg.reply(text);
}

// Warn a user (admin only)
async function handleWarnCommand(msg, chat, contact) {
    if (!chat.isGroup) return msg.reply('This command is for groups only.');
    const mentions = await msg.getMentions();
    if (mentions.length === 0) return msg.reply('Mention a user to warn.');
    const userId = mentions[0].id._serialized;
    db.users[userId] = db.users[userId] || {
        id: userId, name: mentions[0].pushname, xp: 0, level: 1, joined: new Date().toISOString(), warnings: 0
    };
    db.users[userId].warnings = (db.users[userId].warnings || 0) + 1;
    await msg.reply(`⚠️ Warned ${db.users[userId].name}. Total warnings: ${db.users[userId].warnings}`);
}

// List all users with warnings
async function handleWarnedCommand(msg) {
    const warned = Object.values(db.users).filter(u => u.warnings > 0);
    if (!warned.length) return msg.reply('No warned users.');
    await msg.reply("⚠️ Warned users:\n" + warned.map(u => `${u.name}: ${u.warnings} warnings`).join('\n'));
}

async function handleOrderCommand(msg, args) {
    if (!args[0]) {
        return await msg.reply('Usage: !order product [coupon]');
    }
    const product = args[0].toLowerCase();
    const coupon = args[1];
    let found = null;
    Object.entries(ebookCategories).forEach(([cat, books]) => {
        books.forEach(b => {
            if (b.toLowerCase().includes(product)) found = { title: b, category: cat };
        });
    });
    if (!found) {
        return await msg.reply('❌ Invalid product. Use !ebooks to see options.');
    }
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const price = applyCoupon(5, coupon); // price logic can be improved per book
    db.orders[orderId] = {
        product: found.title,
        price,
        status: 'pending',
        user: msg.from,
        date: new Date().toISOString()
    };
    await msg.reply(
        `🛒 Order Created: ${orderId}
📦 Product: ${found.title}
💵 Amount: $${price}
🚚 Status: Pending payment

💳 Pay to: EcoCash ${PAYMENT_NUMBER}
📸 Reply with payment screenshot to complete`
    );
}

async function handleEbooksCommand(msg) {
    let list = "";
    Object.entries(ebookCategories).forEach(([cat, books]) => {
        list += `\n*${cat}*\n${books.map(b => `- ${b}`).join('\n')}\n`;
    });
    await msg.reply('📚 Available eBooks:' + list);
}

async function handleBuyCommand(msg, args) {
    if (!args[0]) return await msg.reply('Usage: !buy ebook-name');
    const key = args[0].toLowerCase();
    let found = null;
    Object.entries(ebookCategories).forEach(([cat, books]) => {
        books.forEach(b => {
            if (b.toLowerCase().includes(key)) found = { title: b, category: cat };
        });
    });
    if (!found) return await msg.reply('❌ Invalid ebook name. Use !ebooks to see options.');
    await msg.reply(
        `💳 To buy *${found.title}*:
1. Send $5 to EcoCash ${PAYMENT_NUMBER}
2. Reply with a payment screenshot
3. You'll receive the ebook within 24 hours
`
    );
}

async function handleHelpCommand(msg) {
    const helpText =
        `📖 Available Commands:
!help - Show this message
!rules - Group rules
'!profile - Show your profile and stats\n' +
'!leaderboard - Show top users\n' +
'!warn @user - Warn
!ebooks - List available ebooks
!buy <ebook> - Buy an ebook
!order <ebook> - Place an order
!suggest <idea> - Send suggestion to admin
!menu - Show services menu
!bot - Bot status
!kick @user - Kick user (admin)
!slowmode <sec> - Enable slow mode (admin)
!slowoff - Disable slow mode (admin)
!welcome - Welcome message`;
    await msg.reply(helpText);
}

async function handleRulesCommand(msg, chat) {
    const chatId = chat.id._serialized;
    const groupRules = db.groups[chatId]?.rulesContent;
    await msg.reply(
        groupRules ?
            `📜 *Group Rules:*\n${groupRules}` :
            '📜 Default Rules:\n1. Be respectful\n2. No spamming\n3. No inappropriate content'
    );
}

async function handleWelcomeCommand(msg, chat) {
    const chatId = chat.id._serialized;
    const welcomeMsg = db.groups[chatId]?.welcomeMessage || '👋 Welcome to the group!';
    await msg.reply(welcomeMsg);
}

async function handleKickCommand(msg, chat) {
    const mentions = await msg.getMentions();
    if (mentions.length === 0) {
        return await msg.reply('⚠️ Please mention a user to kick.');
    }
    const userToKick = mentions[0].id._serialized;
    await chat.removeParticipants([userToKick]);
    await msg.reply('👢 User has been removed.');
}

async function handleSlowModeCommand(msg, chat, args) {
    if (args.length === 0 || isNaN(args[0])) {
        return await msg.reply('⏱️ Usage: !slowmode <seconds>');
    }
    const seconds = parseInt(args[0]);
    const chatId = chat.id._serialized;
    groupFeatures.slowMode[chatId] = { interval: seconds * 1000 };
    await msg.reply(`🚫 Slow mode enabled: 1 message every ${seconds} seconds`);
}

async function handleSlowOffCommand(msg, chat) {
    const chatId = chat.id._serialized;
    delete groupFeatures.slowMode[chatId];
    await msg.reply('✅ Slow mode disabled');
}

// ===================
// ADMIN COMMANDS
// ===================
async function handleAdminCommands(msg, chat) {
    const body = msg.body.toLowerCase();
    const chatId = chat.id._serialized;
    if (body === '!lock') {
        groupFeatures.mutedGroups[chatId] = true;
        await msg.reply('🔒 Group locked! Only admins can speak.');
    }
    if (body === '!unlock') {
        groupFeatures.mutedGroups[chatId] = false;
        await msg.reply('🔓 Group unlocked! Everyone can speak.');
    }
    if (body === '!nightmode on') {
        groupFeatures.nightMode[chatId] = true;
        await msg.reply('🌙 Night mode enabled. Group muted until morning.');
    }
    if (body === '!nightmode off') {
        groupFeatures.nightMode[chatId] = false;
        await msg.reply('☀️ Night mode disabled. Group active.');
    }
    if (body.startsWith('!tempban')) {
        const parts = body.split(' ');
        if (parts.length < 3) return;
        const mentions = await msg.getMentions();
        if (mentions.length === 0) return;
        const duration = parseInt(parts[2]);
        if (isNaN(duration)) return;
        const userToBan = mentions[0].id._serialized;
        await chat.removeParticipants([userToBan]);
        setTimeout(async () => {
            try {
                await chat.addParticipants([userToBan]);
            } catch (e) {
                console.error('Failed to unban:', e);
            }
        }, duration * 60000);
        await msg.reply(`⏳ Temporarily banned user for ${duration} minutes`);
    }
 // Inside handleCommandSystem, add to the switch case
switch (command) {
    // ... existing commands ...
    case 'quiz':
        await handleQuizCommand(msg);
        break;
    // ... other commands ...
}
}

// ===================
// UTILITY FUNCTIONS
// ===================
function updateUserXP(userId, points) {
    const user = db.users[userId];
    if (!user) return;
    user.xp += points;
    const nextLevel = user.level * 100;
    if (user.xp >= nextLevel) {
        user.level++;
        client.sendMessage(userId, `🎉 Level up! You're now level ${user.level}`);
    }
}
function applyCoupon(price, coupon) {
    if (coupon && db.coupons[coupon]) {
        const { discount, validUntil } = db.coupons[coupon];
        if (!validUntil || new Date() <= new Date(validUntil)) {
            return price * (1 - discount / 100);
        }
    }
    return price;
}
function backupDatabase() {
    fs.writeFile('db-backup.json', JSON.stringify(db, null, 2), err => {
        if (err) console.error('Backup failed:', err);
    });
}
function initScheduledTasks() {
    cron.schedule('0 7 * * *', async () => {
        for (const chatId in db.groups) {
            try {
                const chat = await client.getChatById(chatId);
                if (db.groups[chatId].dailyMessage) {
                    await chat.sendMessage('📖 Daily Inspiration: Start your day with purpose!');
                }
            } catch (e) {
                console.warn(`Skipping group ${chatId} - bot might have left.`);
            }
        }
    });
    cron.schedule('0 9 * * 1', () => generateWeeklyReport());

}
function initScheduledTasks() {
    // ...existing scheduled tasks...

    // Auto nightmode ON at 22:00
    cron.schedule('0 22 * * *', async () => {
        for (const chatId in db.groups) {
            groupFeatures.nightMode[chatId] = true;
            groupFeatures.mutedGroups[chatId] = true;
            try {
                const chat = await client.getChatById(chatId);
                await chat.sendMessage("🌙 Night mode enabled. Group muted until morning.");
            } catch (e) { /* handle error */ }
        }
    });

    // Auto nightmode OFF at 06:00
    cron.schedule('0 6 * * *', async () => {
        for (const chatId in db.groups) {
            groupFeatures.nightMode[chatId] = false;
            groupFeatures.mutedGroups[chatId] = false;
            try {
                const chat = await client.getChatById(chatId);
                await chat.sendMessage("☀️ Night mode disabled. Group active.");
            } catch (e) { /* handle error */ }
        }
    });

    // ...other scheduled tasks...
}
async function generateWeeklyReport() {
    let report = "📊 Weekly Report\n\n";
    report += `👥 Total Users: ${Object.keys(db.users).length}\n`;
    report += `🛒 Total Orders: ${Object.keys(db.orders).length}\n`;
    report += `💸 Total Revenue: $${calculateTotalRevenue()}\n\n`;
    report += "🚀 Top Users:\n";
    const topUsers = Object.values(db.users)
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 5);
    topUsers.forEach((user, idx) => {
        report += `${idx + 1}. ${user.name} - Level ${user.level}\n`;
    });
    await client.sendMessage(ADMIN_NUMBER, report);
}
function calculateTotalRevenue() {
    return Object.values(db.orders).reduce((total, order) => total + (order.price || 0), 0);
}

// ===================
// DM AUTOREPLY INTENTS
// ===================
async function handleDirectMessageAutoReplyAdvanced(msg, body, contact) {
    const fromId = msg.from;
    const text = body.toLowerCase();
    if (!dmContexts[fromId]) {
        dmContexts[fromId] = { step: 0, lastIntent: null };
    }
    const context = dmContexts[fromId];
    const intents = [
        {
            name: 'greeting',
            patterns: [/^hi$|^hello$|^hey$|^helo$|^hai$/i],
            responses: [
                `Hey ${contact.pushname || 'there'}! How can I help you today? 😊`,
                `Hello! What can I do for you?`,
                `Hi! Need any assistance?`,
            ],
        },
        {
            name: 'thanks',
            patterns: [/thank(s| you)|thx/i],
            responses: [
                "You're very welcome! 😄",
                "Anytime! Let me know if you need anything else.",
            ],
        },
        {
            name: 'help',
            patterns: [/help|support|assist|issue|problem/i],
            responses: [
                "Sure! You can type !help to see all commands or just ask me anything.",
                "Need assistance? Try commands like !ebooks, !order, or just ask me.",
            ],
        },
        {
            name: 'order',
            patterns: [/order|buy|ebooks|price|cost/i],
            responses: [
                "To see available ebooks, type !ebooks.",
                "You can place an order by typing !order <ebook-name>.",
                "Prices vary depending on the ebook, check !ebooks for details.",
            ],
        },
        {
            name: 'bot_info',
            patterns: [/your name|who are you|what are you/i],
            responses: [
                "I'm BriteAtom Bot 🤖, here to assist you 24/7!",
                "I'm your friendly WhatsApp assistant, ready to help.",
            ],
        },
        {
            name: 'goodbye',
            patterns: [/bye|goodbye|see you|later/i],
            responses: [
                "Goodbye! Feel free to message me anytime.",
                "See you later! Take care.",
            ],
        },
        {
            name: 'time',
            patterns: [/time|date|day|clock/i],
            responses: [
                `Current server time is: ${new Date().toLocaleString()}`,
            ],
        },
    ];
    for (const intent of intents) {
        for (const pattern of intent.patterns) {
            if (pattern.test(text)) {
                const reply = randomChoice(intent.responses);
                await msg.reply(reply);
                context.lastIntent = intent.name;
                context.step = 1;
                return true;
            }
        }
    }
    // Multi-turn follow-ups example (simple)
    if (context.lastIntent === 'order' && context.step === 1) {
        if (text.includes('python') || text.includes('free')) {
            await msg.reply(
                "Great choice! Use !order python or !order free to place your order."
            );
            context.step = 2;
            return true;
        }
        await msg.reply(
            "Please specify the ebook name or type !ebooks to see all available ebooks."
        );
        return true;
    }
    await msg.reply(
        "I'm not sure I understand. You can type !help to see what I can do."
    );
    return false;
}
function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ===================
// SAVE DATABASE
// ===================
setInterval(() => {
    try {
        fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
        console.log('Database saved');
    } catch (e) {
        console.error('Database save error:', e);
    }
}, 300000);

// ===================
// INIT
// ===================
client.initialize();