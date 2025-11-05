function createQuickActionImaginationModules({ QuickActionContext, QuickActionTools }) {
    const QuickActionImaginationModules = [
        {
            id: 'imagination-trigger-dawn-intentions',
            category: 'trigger',
            name: 'Dawn intention planner',
            description: 'Start the day by outlining focus areas, tone, and energy rituals.',
            icon: 'sunrise',
            accent: '#f97316',
            tags: [
                'planning',
                'mindset',
                'ritual',
            ],
            inputs: [],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                tone: 'optimistic and calm',
                affirmation: 'I welcome progress in gentle steps.',
                focusAreas: '',
                moodPalette: '',
                timeMarkers: '',
            },
            form: [
                {
                    key: 'tone',
                    type: 'text',
                    label: 'Tone for the day',
                    placeholder: 'optimistic and calm',
                    default: 'optimistic and calm',
                },
                {
                    key: 'affirmation',
                    type: 'textarea',
                    rows: 2,
                    label: 'Personal affirmation',
                    placeholder: 'I welcome progress in gentle steps.',
                    default: 'I welcome progress in gentle steps.',
                },
                {
                    key: 'focusAreas',
                    type: 'textarea',
                    rows: 4,
                    label: 'Focus areas (one per line)',
                    placeholder: 'Deep work\\nCollaborative sync\\nLearning',
                    default: '',
                },
                {
                    key: 'moodPalette',
                    type: 'textarea',
                    rows: 3,
                    label: 'Mood palette (one per line)',
                    placeholder: 'curiosity\\nstability\\nlight-hearted',
                    default: '',
                },
                {
                    key: 'timeMarkers',
                    type: 'textarea',
                    rows: 3,
                    label: 'Time markers',
                    placeholder: 'Sunrise warm-up\\nMidday stretch\\nEvening reflection',
                    default: '',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const now = new Date();
                const focusLines = String(config?.focusAreas || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackFocus = [
            'Deep work on meaningful projects',
            'Connect with teammates to unblock progress',
            'Document insights and decisions clearly',
            'Invest time into learning a new craft',
            'Strengthen body with mindful movement',
            'Declutter the workspace for clarity',
            'Reach out to someone who inspires you',
            'Complete a creative experiment',
            'Celebrate a small win along the way',
            'Support someone who needs encouragement',
            'Explore an idea without judging it',
            'Balance ambition with sustainable pacing',
        ];
                const focusList = focusLines.length > 0 ? focusLines : fallbackFocus;
                const tone = String(config?.tone || "optimistic").trim() || "optimistic";
                const moodLines = String(config?.moodPalette || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackMood = [
            'curious brightness',
            'grounded optimism',
            'quiet bravery',
            'creative openness',
            'restorative patience',
            'playful experimentation',
            'gentle accountability',
            'thoughtful momentum',
            'empathetic listening',
            'calm determination',
        ];
                const moodPalette = moodLines.length > 0 ? moodLines : fallbackMood;
                const markerLines = String(config?.timeMarkers || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackMarkers = [
            'Sunrise stretch and breathing',
            'Focused creation session',
            'Walk & reflect break',
            'Learning immersion',
            'Connection call or message',
            'Reset the environment',
            'Evening gratitude review',
        ];
                const timeline = markerLines.length > 0 ? markerLines : fallbackMarkers;
                const affirmation = String(config?.affirmation || "I am building momentum with care.").trim();
                const statementLines = [];
                statementLines.push(`Focus for ${now.toLocaleDateString()} (${tone})`);
                statementLines.push("");
                statementLines.push("Primary focus pillars:");
                focusList.forEach((item, index) => statementLines.push(`- ${index + 1}. ${item}`));
                statementLines.push("");
                statementLines.push("Mood palette to embody:");
                moodPalette.forEach((mood, index) => {
                    const icon = index % 2 === 0 ? "•" : "◦";
                    statementLines.push(`  ${icon} ${mood}`);
                });
                statementLines.push("");
                statementLines.push("Timeline pulses:");
                timeline.forEach((entry, index) => {
                    const timeIcon = index === 0 ? "🌅" : (index === timeline.length - 1 ? "🌙" : "⏰");
                    statementLines.push(`  ${timeIcon} ${entry}`);
                });
                statementLines.push("");
                if (affirmation) {
                    statementLines.push("Affirmation:");
                    statementLines.push(`  ${affirmation}`);
                    statementLines.push("");
                }
                clone.payload = statementLines.join("
        ");
                clone.vars.lastIntention = { tone, focusList, moodPalette, timeline, createdAt: now.toISOString() };
                clone.logs.push("Generated dawn intention planner block.");
                return [clone];
            }
        },
        {
            id: 'imagination-trigger-random-theme',
            category: 'trigger',
            name: 'Random theme spark',
            description: 'Generate a playful theme and supporting anchors for the next session.',
            icon: 'compass',
            accent: '#38bdf8',
            tags: [
                'creativity',
                'spark',
                'trigger',
            ],
            inputs: [],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                themes: '',
                anchors: '',
                includeHistory: false,
            },
            form: [
                {
                    key: 'themes',
                    type: 'textarea',
                    rows: 5,
                    label: 'Custom themes',
                    placeholder: 'Lighthouse focus\\nPaper planes\\nPlayful structure',
                    default: '',
                },
                {
                    key: 'anchors',
                    type: 'textarea',
                    rows: 4,
                    label: 'Anchor ideas',
                    placeholder: 'Collect metaphors\\nSketch quick scenarios\\nList vibrant verbs',
                    default: '',
                },
                {
                    key: 'includeHistory',
                    type: 'checkbox',
                    label: 'Include context about previous payload if available',
                    default: false,
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const themeLines = String(config?.themes || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackThemes = [
            'Slow brewing ideas',
            'Maps and territories',
            'Secret library whispers',
            'Handwritten adventures',
            'Kind rebellion',
            'Quiet storms',
            'Magnetic pathways',
            'Soft neon dreams',
            'Curiosity carnival',
            'Gentle lighthouse signal',
            'Patchwork momentum',
            'Crisp mountain clarity',
        ];
                const themePool = themeLines.length > 0 ? themeLines : fallbackThemes;
                const anchorLines = String(config?.anchors || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackAnchors = [
            'List three sounds that match the theme',
            'Sketch a quick storyboard in words',
            'Design a ritual that embodies the idea',
            'Collect metaphors from current work',
            'Rewrite a goal using this mood',
            'Describe the opposite of the theme',
            'Highlight a teammate who radiates this energy',
            'Note one experiment to run in the theme',
            'Capture a quote or lyric that fits',
            'Create a check-in question for later',
        ];
                const anchorPool = anchorLines.length > 0 ? anchorLines : fallbackAnchors;
                const themeIndex = themePool.length > 0 ? Math.floor(Math.random() * themePool.length) : 0;
                const anchorCount = Math.max(3, Math.min(6, anchorPool.length));
                const selectedAnchors = anchorPool.slice(0, anchorCount);
                const chosenTheme = themePool[themeIndex] || "Impromptu theme";
                const summaryLines = [];
                summaryLines.push(`Theme spark: ${chosenTheme}`);
                summaryLines.push("");
                summaryLines.push("Anchors to explore:");
                selectedAnchors.forEach(anchor => summaryLines.push(`- ${anchor}`));
                if (config?.includeHistory && clone.payload) {
                    summaryLines.push("");
                    summaryLines.push("Context from previous payload:");
                    QuickActionTools.toText(clone.payload).split(/        ?
        /).slice(0, 5).forEach(line => summaryLines.push(`  > ${line}`));
                }
                clone.payload = summaryLines.join("
        ");
                clone.vars.lastThemeSpark = { theme: chosenTheme, anchors: selectedAnchors };
                clone.logs.push("Generated random theme spark block.");
                return [clone];
            }
        },
        {
            id: 'imagination-trigger-weekday-ritual',
            category: 'trigger',
            name: 'Weekday ritual weaver',
            description: 'Compose a micro-ritual tailored to the current weekday.',
            icon: 'calendar',
            accent: '#22c55e',
            tags: [
                'routine',
                'ritual',
                'mindset',
            ],
            inputs: [],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                rituals: '',
                extraNotes: '',
            },
            form: [
                {
                    key: 'rituals',
                    type: 'textarea',
                    rows: 6,
                    label: 'Preferred rituals',
                    placeholder: 'Monday: Map priorities\\nTuesday: Share praise\\nWednesday: Midweek stretch',
                    default: '',
                },
                {
                    key: 'extraNotes',
                    type: 'textarea',
                    rows: 3,
                    label: 'Extra notes',
                    placeholder: 'Add a playlist that suits the rhythm.',
                    default: '',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const now = new Date();
                const weekday = now.toLocaleDateString(undefined, { weekday: "long" }).toLowerCase();
                const ritualEntries = String(config?.rituals || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const custom = {};
                ritualEntries.forEach(entry => {
                    const [day, ...rest] = entry.split(":");
                    if (!day || rest.length === 0) return;
                    const key = day.trim().toLowerCase();
                    const value = rest.join(":").trim();
                    if (!custom[key]) custom[key] = [];
                    custom[key].push(value);
                });
                const fallback = {
            monday: [
                'Reset expectations',
                'Choose lighthouse tasks',
                'Clear digital clutter',
            ],
            tuesday: [
                'Pair with someone for feedback',
                'Document learnings',
                'Celebrate a colleague',
            ],
            wednesday: [
                'Take a stretching pause',
                'Refuel with inspiring reading',
                'Review momentum',
            ],
            thursday: [
                'Prototype something tiny',
                'Send gratitude notes',
                'Prepare restful buffer',
            ],
            friday: [
                'Reflect on highlights',
                'Archive and tidy',
                'Plan a gentle closeout',
            ],
        };
                const rituals = custom[weekday] && custom[weekday].length > 0 ? custom[weekday] : (fallback[weekday] || fallback.monday || []);
                const plan = [];
                plan.push(`Weekday ritual for ${weekday.charAt(0).toUpperCase() + weekday.slice(1)}`);
                plan.push("");
                rituals.slice(0, 5).forEach((item, index) => plan.push(`${index + 1}. ${item}`));
                if (config?.extraNotes) {
                    plan.push("");
                    plan.push("Notes:");
                    plan.push(`  ${config.extraNotes}`);
                }
                clone.payload = plan.join("
        ");
                clone.vars.lastRitual = { weekday, rituals };
                clone.logs.push("Generated weekday ritual weaver block.");
                return [clone];
            }
        },
        {
            id: 'imagination-trigger-monthly-reflection',
            category: 'trigger',
            name: 'Monthly reflection lens',
            description: 'Craft a reflection canvas based on the current month and momentum.',
            icon: 'circle',
            accent: '#a855f7',
            tags: [
                'reflection',
                'journaling',
                'trigger',
            ],
            inputs: [],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                milestones: '',
                learningFocus: 'Resilience and flow',
                gratitude: '',
            },
            form: [
                {
                    key: 'milestones',
                    type: 'textarea',
                    rows: 4,
                    label: 'Milestones to consider',
                    placeholder: 'Shipped feature alpha\\nHosted community session',
                    default: '',
                },
                {
                    key: 'learningFocus',
                    type: 'text',
                    label: 'Learning focus',
                    placeholder: 'Resilience and flow',
                    default: 'Resilience and flow',
                },
                {
                    key: 'gratitude',
                    type: 'textarea',
                    rows: 3,
                    label: 'Gratitude seeds',
                    placeholder: 'Mentors\\nCollaborators\\nFresh perspectives',
                    default: '',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const now = new Date();
                const monthName = now.toLocaleDateString(undefined, { month: "long" });
                const monthIndex = now.getMonth();
                const seasonMap = ["winter", "winter", "spring", "spring", "spring", "summer", "summer", "summer", "autumn", "autumn", "autumn", "winter"];
                const season = seasonMap[monthIndex];
                const seasonIdeas = {
            winter: [
                'Protect energy with clear boundaries',
                'Seek warmth in community gatherings',
                'Curate small sparks of joy',
            ],
            spring: [
                'Experiment with playful prototypes',
                'Invite feedback early',
                'Embrace beginner wonder',
            ],
            summer: [
                'Amplify what is already working',
                'Design celebrations for progress',
                'Share knowledge outward',
            ],
            autumn: [
                'Archive lessons with care',
                'Prepare new soil for ideas',
                'Let go of what no longer fits',
            ],
        };
                const prompts = [
            'What felt surprisingly easy this month?',
            'Where did curiosity lead the way?',
            'Which relationship grew stronger?',
            'What needs a gentle pause or ending?',
            'Which experiment deserves a sequel?',
            'What rhythms kept you steady?',
            'How did you show generosity?',
            'Where is there room for more play?',
        ];
                const milestoneLines = String(config?.milestones || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const gratitudeLines = String(config?.gratitude || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const selectedPrompts = prompts.slice(0, 5);
                const reflection = [];
                reflection.push(`Reflection for ${monthName}`);
                reflection.push(`Season lens: ${season}`);
                reflection.push("");
                reflection.push("Season invitations:");
                (seasonIdeas[season] || []).forEach(item => reflection.push(`- ${item}`));
                if (milestoneLines.length > 0) {
                    reflection.push("");
                    reflection.push("Milestones worth celebrating:");
                    milestoneLines.forEach(item => reflection.push(`- ${item}`));
                }
                reflection.push("");
                reflection.push(`Learning focus: ${config?.learningFocus || "Growth with gentleness"}`);
                reflection.push("");
                reflection.push("Questions to explore:");
                selectedPrompts.forEach((prompt, index) => reflection.push(`${index + 1}. ${prompt}`));
                if (gratitudeLines.length > 0) {
                    reflection.push("");
                    reflection.push("Gratitude seeds:");
                    gratitudeLines.forEach(item => reflection.push(`- ${item}`));
                }
                clone.payload = reflection.join("
        ");
                clone.vars.lastReflection = { month: monthName, season, prompts: selectedPrompts };
                clone.logs.push("Generated monthly reflection lens block.");
                return [clone];
            }
        },
        {
            id: 'imagination-trigger-seasonal-checkin',
            category: 'trigger',
            name: 'Seasonal check-in compass',
            description: 'Translate the current season into focus points and supportive actions.',
            icon: 'feather',
            accent: '#facc15',
            tags: [
                'seasonal',
                'mindfulness',
                'trigger',
            ],
            inputs: [],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                hemisphere: 'north',
                customSupport: '',
            },
            form: [
                {
                    key: 'hemisphere',
                    type: 'select',
                    label: 'Hemisphere',
                    options: [
                        {
                            value: 'north',
                            label: 'Northern Hemisphere',
                        },
                        {
                            value: 'south',
                            label: 'Southern Hemisphere',
                        },
                    ],
                    default: 'north',
                },
                {
                    key: 'customSupport',
                    type: 'textarea',
                    rows: 3,
                    label: 'Supportive habits',
                    placeholder: 'Drink warm tea\\nSchedule daylight walks',
                    default: '',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const now = new Date();
                const hemisphere = (config?.hemisphere || "north").toLowerCase() === "south" ? "south" : "north";
                const monthIndex = now.getMonth();
                const northMap = ["winter", "winter", "spring", "spring", "spring", "summer", "summer", "summer", "autumn", "autumn", "autumn", "winter"];
                const southMap = ["summer", "summer", "autumn", "autumn", "autumn", "winter", "winter", "winter", "spring", "spring", "spring", "summer"];
                const season = hemisphere === "south" ? southMap[monthIndex] : northMap[monthIndex];
                const seasonActions = {
            spring: [
                'Open windows for fresh ideas',
                'Invite new collaborators',
                'Plant small experiments',
            ],
            summer: [
                'Simplify commitments',
                'Celebrate progress loudly',
                'Create space for rest',
            ],
            autumn: [
                'Harvest lessons learned',
                'Refine goals for clarity',
                'Share stories generously',
            ],
            winter: [
                'Protect reflective time',
                'Layer supportive routines',
                'Light candles of inspiration',
            ],
        };
                const customSupport = String(config?.customSupport || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const supportList = customSupport.length > 0 ? customSupport : (seasonActions[season] || []);
                const linesOut = [];
                linesOut.push(`Seasonal check-in: ${season}`);
                linesOut.push(`Hemisphere: ${hemisphere}`);
                linesOut.push("");
                supportList.slice(0, 6).forEach((item, index) => linesOut.push(`${index + 1}. ${item}`));
                clone.payload = linesOut.join("
        ");
                clone.vars.lastSeasonCompass = { season, hemisphere, suggestions: supportList };
                clone.logs.push("Generated seasonal check-in compass block.");
                return [clone];
            }
        },
        {
            id: 'imagination-trigger-creative-seed',
            category: 'trigger',
            name: 'Creative seed mixer',
            description: 'Blend random words and senses into a surprising creative brief.',
            icon: 'aperture',
            accent: '#fb7185',
            tags: [
                'creativity',
                'ideation',
                'trigger',
            ],
            inputs: [],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                concepts: '',
                senses: '',
                actionVerbs: '',
            },
            form: [
                {
                    key: 'concepts',
                    type: 'textarea',
                    rows: 4,
                    label: 'Concept seeds',
                    placeholder: 'Paper garden\\nFloating city\\nCloud bakery',
                    default: '',
                },
                {
                    key: 'senses',
                    type: 'textarea',
                    rows: 4,
                    label: 'Sensory cues',
                    placeholder: 'Warm cinnamon\\nEchoing laughter\\nSilver sparkles',
                    default: '',
                },
                {
                    key: 'actionVerbs',
                    type: 'textarea',
                    rows: 3,
                    label: 'Action verbs',
                    placeholder: 'weave\\ncraft\\nilluminate',
                    default: '',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const conceptPool = String(config?.concepts || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const sensePool = String(config?.senses || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const verbPool = String(config?.actionVerbs || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackConcepts = [
            'Pocket observatory',
            'Rainforest chorus',
            'Urban fireflies',
            'Time-traveling notebook',
            'Stardust archive',
            'Midnight bakery',
            'Cloudtop studio',
            'Storytelling compass',
        ];
                const fallbackSenses = [
            'the scent of pine needles',
            'echoes of a friendly choir',
            'soft linen textures',
            'twinkling copper lights',
            'footsteps on mosaic tiles',
            'whispers of sea breeze',
        ];
                const fallbackVerbs = [
            'weave',
            'sketch',
            'compose',
            'nurture',
            'illuminate',
            'anchor',
            'orchestrate',
            'braid',
        ];
                const concepts = conceptPool.length > 0 ? conceptPool : fallbackConcepts;
                const senses = sensePool.length > 0 ? sensePool : fallbackSenses;
                const verbs = verbPool.length > 0 ? verbPool : fallbackVerbs;
                const pick = list => list[Math.floor(Math.random() * list.length)] || "idea";
                const selectedConcept = pick(concepts);
                const selectedSense = pick(senses);
                const selectedVerb = pick(verbs);
                const promptLines = [];
                promptLines.push(`Creative seed: ${selectedConcept}`);
                promptLines.push(`Sensory hook: ${selectedSense}`);
                promptLines.push(`Action cue: ${selectedVerb}`);
                promptLines.push("");
                promptLines.push("Prompt questions:");
                promptLines.push(`- How does ${selectedVerb} change the experience?`);
                promptLines.push(`- Which textures describe ${selectedSense}?`);
                promptLines.push(`- Where could ${selectedConcept} live in daily life?`);
                clone.payload = promptLines.join("
        ");
                clone.vars.lastCreativeSeed = { concept: selectedConcept, sense: selectedSense, action: selectedVerb };
                clone.logs.push("Generated creative seed mixer block.");
                return [clone];
            }
        },
        {
            id: 'imagination-trigger-gratitude-flow',
            category: 'trigger',
            name: 'Gratitude flow starter',
            description: 'Gather gratitude prompts and assemble a reflection flow.',
            icon: 'heart',
            accent: '#ef4444',
            tags: [
                'gratitude',
                'reflection',
                'mindset',
            ],
            inputs: [],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                people: '',
                moments: '',
                supportingAction: 'Send a thank-you note',
            },
            form: [
                {
                    key: 'people',
                    type: 'textarea',
                    rows: 4,
                    label: 'People to appreciate',
                    placeholder: 'A mentor\\nA teammate\\nA neighbour',
                    default: '',
                },
                {
                    key: 'moments',
                    type: 'textarea',
                    rows: 4,
                    label: 'Moments worth savouring',
                    placeholder: 'First sip of tea\\nUnexpected compliment',
                    default: '',
                },
                {
                    key: 'supportingAction',
                    type: 'text',
                    label: 'Follow-up action',
                    placeholder: 'Send a thank-you note',
                    default: 'Send a thank-you note',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const peopleLines = String(config?.people || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const momentLines = String(config?.moments || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackPeople = [
            'A thoughtful guide',
            'A collaborator who listened',
            'Someone cheering from afar',
            'A neighbour who shared kindness',
            'A creator whose work moved you',
            'A family member who showed up',
        ];
                const fallbackMoments = [
            'A moment of quiet sunrise',
            'Hearing laughter during a call',
            'Finding the perfect phrase',
            'Receiving an encouraging message',
            'Seeing someone else shine',
            'Learning something unexpected',
        ];
                const people = peopleLines.length > 0 ? peopleLines : fallbackPeople;
                const moments = momentLines.length > 0 ? momentLines : fallbackMoments;
                const action = String(config?.supportingAction || "Share a thank-you note").trim();
                const flowLines = [];
                flowLines.push("Gratitude flow");
                flowLines.push("");
                flowLines.push("People to appreciate:");
                people.slice(0, 6).forEach(person => flowLines.push(`- ${person}`));
                flowLines.push("");
                flowLines.push("Moments worth remembering:");
                moments.slice(0, 6).forEach(moment => flowLines.push(`- ${moment}`));
                flowLines.push("");
                flowLines.push(`Follow-up action: ${action}`);
                clone.payload = flowLines.join("
        ");
                clone.vars.lastGratitude = { people, moments, action };
                clone.logs.push("Generated gratitude flow starter block.");
                return [clone];
            }
        },
        {
            id: 'imagination-trigger-vision-canvas',
            category: 'trigger',
            name: 'Vision canvas igniter',
            description: 'Sketch a vivid future snapshot with north stars and allies.',
            icon: 'star',
            accent: '#fbbf24',
            tags: [
                'vision',
                'strategy',
                'trigger',
            ],
            inputs: [],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                northStar: 'A welcoming platform for every voice',
                allies: '',
                signals: '',
            },
            form: [
                {
                    key: 'northStar',
                    type: 'text',
                    label: 'North star headline',
                    placeholder: 'A welcoming platform for every voice',
                    default: 'A welcoming platform for every voice',
                },
                {
                    key: 'allies',
                    type: 'textarea',
                    rows: 4,
                    label: 'Allies & contributors',
                    placeholder: 'Community champions\\nProduct storytellers\\nAccessibility advocates',
                    default: '',
                },
                {
                    key: 'signals',
                    type: 'textarea',
                    rows: 4,
                    label: 'Signals of progress',
                    placeholder: 'Messages of relief\\nShared celebrations\\nNew invitations',
                    default: '',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const northStar = String(config?.northStar || "A welcoming platform for every voice").trim();
                const allyLines = String(config?.allies || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const signalLines = String(config?.signals || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackAllies = [
            'Courageous testers',
            'Storytelling partners',
            'Quiet specialists',
            'Curious new joiners',
            'Community caretakers',
            'Accessibility advocates',
        ];
                const fallbackSignals = [
            'People returning with friends',
            'Notes about feeling seen',
            'Improved flow for new joiners',
            'A calmer support inbox',
            'Ideas spreading organically',
            'Unexpected collaborations',
        ];
                const allies = allyLines.length > 0 ? allyLines : fallbackAllies;
                const signals = signalLines.length > 0 ? signalLines : fallbackSignals;
                const canvas = [];
                canvas.push(`North star: ${northStar}`);
                canvas.push("");
                canvas.push("Allies & contributors:");
                allies.slice(0, 6).forEach(ally => canvas.push(`- ${ally}`));
                canvas.push("");
                canvas.push("Signals of progress:");
                signals.slice(0, 6).forEach(signal => canvas.push(`- ${signal}`));
                clone.payload = canvas.join("
        ");
                clone.vars.lastVisionCanvas = { northStar, allies, signals };
                clone.logs.push("Generated vision canvas igniter block.");
                return [clone];
            }
        },
        {
            id: 'imagination-trigger-mood-compass',
            category: 'trigger',
            name: 'Mood compass calibrator',
            description: 'Check-in with multiple moods and choose guiding cues.',
            icon: 'activity',
            accent: '#34d399',
            tags: [
                'mood',
                'reflection',
                'trigger',
            ],
            inputs: [],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                moods: '',
                cues: '',
                primaryWeight: 3,
            },
            form: [
                {
                    key: 'moods',
                    type: 'textarea',
                    rows: 4,
                    label: 'Mood palette',
                    placeholder: 'energised\\nsoft focus\\nsteady tides',
                    default: '',
                },
                {
                    key: 'cues',
                    type: 'textarea',
                    rows: 4,
                    label: 'Guiding cues',
                    placeholder: 'move gently\\nshare warmth\\nprotect focus',
                    default: '',
                },
                {
                    key: 'primaryWeight',
                    type: 'number',
                    label: 'Weight for first mood',
                    default: 3,
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const moods = String(config?.moods || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const cues = String(config?.cues || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackMoods = [
            'energised',
            'soft focus',
            'reflective',
            'curious',
            'playful',
            'steady tides',
            'bold & bright',
            'quiet repair',
        ];
                const fallbackCues = [
            'move gently',
            'share warmth',
            'protect focus',
            'invite questions',
            'celebrate progress',
            'allow rest',
            'document insights',
            'pair with someone',
        ];
                const palette = moods.length > 0 ? moods : fallbackMoods;
                const cuesList = cues.length > 0 ? cues : fallbackCues;
                const weight = Number(config?.primaryWeight) || 3;
                const summary = [];
                summary.push("Mood compass");
                summary.push("");
                palette.slice(0, 4).forEach((mood, index) => {
                    const emphasis = index === 0 ? weight : 1;
                    summary.push(`${index + 1}. ${mood} (weight ${emphasis})`);
                });
                summary.push("");
                summary.push("Guiding cues:");
                cuesList.slice(0, 6).forEach(cue => summary.push(`- ${cue}`));
                clone.payload = summary.join("
        ");
                clone.vars.lastMoodCompass = { palette, cues: cuesList, weight };
                clone.logs.push("Generated mood compass calibrator block.");
                return [clone];
            }
        },
        {
            id: 'imagination-trigger-daily-briefing',
            category: 'trigger',
            name: 'Daily briefing builder',
            description: 'Assemble a daily brief with highlights, constraints, and momentum actions.',
            icon: 'list',
            accent: '#60a5fa',
            tags: [
                'planning',
                'briefing',
                'trigger',
            ],
            inputs: [],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                highlights: '',
                constraints: '',
                momentumActions: '',
                includePayloadSummary: true,
            },
            form: [
                {
                    key: 'highlights',
                    type: 'textarea',
                    rows: 4,
                    label: 'Highlights to surface',
                    placeholder: 'Prototype ready for review\\nCustomer story to share',
                    default: '',
                },
                {
                    key: 'constraints',
                    type: 'textarea',
                    rows: 3,
                    label: 'Constraints to respect',
                    placeholder: 'Limited availability after 4pm\\nDependence on design review',
                    default: '',
                },
                {
                    key: 'momentumActions',
                    type: 'textarea',
                    rows: 4,
                    label: 'Momentum actions',
                    placeholder: 'Share blockers early\\nSchedule feedback pulse\\nDocument quick wins',
                    default: '',
                },
                {
                    key: 'includePayloadSummary',
                    type: 'checkbox',
                    label: 'Include summary of current payload',
                    default: true,
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const highlightLines = String(config?.highlights || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const constraintLines = String(config?.constraints || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const momentumLines = String(config?.momentumActions || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackHighlights = [
            'Prototype is ready for review',
            'New testimonial arrived',
            'Team morale is lifting',
            'Fresh idea from the community',
            'Support queue cleared',
            'Design handoff scheduled',
        ];
                const fallbackConstraints = [
            'Bandwidth reduced after noon',
            'Awaiting infrastructure green light',
            'Need clarity on scope trade-offs',
            'Only two review slots available',
        ];
                const fallbackMomentum = [
            'Share blockers before stand-up',
            'Invite async feedback early',
            'Write a short status recap',
            'Capture a demo clip',
            'Send thanks to collaborators',
            'Plan a mini-retro midweek',
        ];
                const highlights = highlightLines.length > 0 ? highlightLines : fallbackHighlights;
                const constraints = constraintLines.length > 0 ? constraintLines : fallbackConstraints;
                const momentum = momentumLines.length > 0 ? momentumLines : fallbackMomentum;
                const briefing = [];
                briefing.push("Daily briefing");
                briefing.push("");
                briefing.push("Highlights:");
                highlights.slice(0, 5).forEach(item => briefing.push(`- ${item}`));
                briefing.push("");
                briefing.push("Constraints:");
                constraints.slice(0, 5).forEach(item => briefing.push(`- ${item}`));
                briefing.push("");
                briefing.push("Momentum actions:");
                momentum.slice(0, 5).forEach(item => briefing.push(`- ${item}`));
                if (config?.includePayloadSummary && clone.payload) {
                    briefing.push("");
                    briefing.push("Payload snapshot:");
                    QuickActionTools.toText(clone.payload).split(/        ?
        /).slice(0, 4).forEach(line => briefing.push(`  > ${line}`));
                }
                clone.payload = briefing.join("
        ");
                clone.vars.lastBriefing = { highlights, constraints, momentum };
                clone.logs.push("Generated daily briefing builder block.");
                return [clone];
            }
        },
        {
            id: 'imagination-trigger-story-prompt',
            category: 'trigger',
            name: 'Story prompt catalyst',
            description: 'Craft a narrative spark mixing protagonists, settings, and twists.',
            icon: 'book-open',
            accent: '#f472b6',
            tags: [
                'storytelling',
                'creative',
                'trigger',
            ],
            inputs: [],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                protagonists: '',
                settings: '',
                twists: '',
            },
            form: [
                {
                    key: 'protagonists',
                    type: 'textarea',
                    rows: 4,
                    label: 'Protagonists',
                    placeholder: 'Curious archivist\\nReluctant inventor\\nKind mischief-maker',
                    default: '',
                },
                {
                    key: 'settings',
                    type: 'textarea',
                    rows: 4,
                    label: 'Settings',
                    placeholder: 'Hidden rooftop garden\\nFloating marketplace\\nQuiet train carriage',
                    default: '',
                },
                {
                    key: 'twists',
                    type: 'textarea',
                    rows: 3,
                    label: 'Twists',
                    placeholder: 'Time pauses during laughter\\nMessages arrive as sketches',
                    default: '',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const protagonists = String(config?.protagonists || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const settings = String(config?.settings || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const twists = String(config?.twists || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackProtagonists = [
            'Curious archivist',
            'Restless cartographer',
            'Soft-spoken engineer',
            'Retired stage magician',
            'Community gardener',
            'Night-shift poet',
        ];
                const fallbackSettings = [
            'Hidden rooftop garden',
            'Floating marketplace',
            'Quiet midnight library',
            'Submerged glass tunnel',
            'Wandering lighthouse',
        ];
                const fallbackTwists = [
            'Time pauses during laughter',
            'Messages arrive as sketches',
            'Gravity changes with music',
            'Dreams become public art',
            'Maps redraw themselves at dawn',
        ];
                const pick = list => list[Math.floor(Math.random() * list.length)] || "character";
                const hero = pick(protagonists.length > 0 ? protagonists : fallbackProtagonists);
                const setting = pick(settings.length > 0 ? settings : fallbackSettings);
                const twist = pick(twists.length > 0 ? twists : fallbackTwists);
                const story = [];
                story.push(`Protagonist: ${hero}`);
                story.push(`Setting: ${setting}`);
                story.push(`Twist: ${twist}`);
                story.push("");
                story.push("Story sparks:");
                story.push(`- What does ${hero.toLowerCase()} want most?`);
                story.push(`- How does the setting challenge them?`);
                story.push(`- When does the twist appear?`);
                clone.payload = story.join("
        ");
                clone.vars.lastStoryPrompt = { hero, setting, twist };
                clone.logs.push("Generated story prompt catalyst block.");
                return [clone];
            }
        },
        {
            id: 'imagination-trigger-playlist-mood',
            category: 'trigger',
            name: 'Playlist mood primer',
            description: 'Generate a playlist-style mood board with tempo, colour, and imagery.',
            icon: 'music',
            accent: '#c084fc',
            tags: [
                'music',
                'mood',
                'trigger',
            ],
            inputs: [],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                tempos: '',
                colours: '',
                visuals: '',
            },
            form: [
                {
                    key: 'tempos',
                    type: 'textarea',
                    rows: 3,
                    label: 'Tempo cues',
                    placeholder: 'gentle lo-fi\\nupbeat synthwave\\nsteady piano',
                    default: '',
                },
                {
                    key: 'colours',
                    type: 'textarea',
                    rows: 3,
                    label: 'Colour palette',
                    placeholder: 'amber glow\\ncobalt dusk\\nsilver morning',
                    default: '',
                },
                {
                    key: 'visuals',
                    type: 'textarea',
                    rows: 3,
                    label: 'Visual imagery',
                    placeholder: 'City lights in the rain\\nSunlit notebooks',
                    default: '',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const tempos = String(config?.tempos || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const colours = String(config?.colours || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const visuals = String(config?.visuals || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackTempos = [
            'gentle lo-fi',
            'steady piano',
            'slow-building strings',
            'playful brass',
            'velvet ambient hum',
        ];
                const fallbackColours = [
            'amber glow',
            'cobalt dusk',
            'silver morning',
            'rose quartz haze',
            'midnight teal',
        ];
                const fallbackVisuals = [
            'City lights in the rain',
            'Sunlit notebooks',
            'Late-night studio lamp',
            'Footprints along the shore',
            'A quiet bustling cafe',
        ];
                const tempoList = tempos.length > 0 ? tempos : fallbackTempos;
                const colourList = colours.length > 0 ? colours : fallbackColours;
                const visualList = visuals.length > 0 ? visuals : fallbackVisuals;
                const playlist = [];
                playlist.push("Playlist mood board");
                playlist.push("");
                playlist.push("Tempo cues:");
                tempoList.slice(0, 5).forEach(item => playlist.push(`- ${item}`));
                playlist.push("");
                playlist.push("Colour palette:");
                colourList.slice(0, 5).forEach(item => playlist.push(`- ${item}`));
                playlist.push("");
                playlist.push("Visual imagery:");
                visualList.slice(0, 5).forEach(item => playlist.push(`- ${item}`));
                clone.payload = playlist.join("
        ");
                clone.vars.lastPlaylistMood = { tempos: tempoList, colours: colourList, visuals: visualList };
                clone.logs.push("Generated playlist mood primer block.");
                return [clone];
            }
        },
        {
            id: 'imagination-action-outline-01',
            category: 'action',
            name: 'Luminous blueprint outline',
            description: 'Shape the payload into a layered outline ready for collaboration.',
            icon: 'layers',
            accent: '#38bdf8',
            tags: [
                'outline',
                'structure',
                'writing',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                title: 'Luminous blueprint outline',
                sections: '',
                style: 'radiant clarity',
                callToAction: 'Identify next micro-step',
            },
            form: [
                {
                    key: 'title',
                    type: 'text',
                    label: 'Outline title',
                    placeholder: 'Luminous blueprint outline',
                    default: 'Luminous blueprint outline',
                },
                {
                    key: 'sections',
                    type: 'textarea',
                    rows: 6,
                    label: 'Custom sections',
                    placeholder: 'Spark focus question\\nAnchor signals to watch\\nRhythm narrative arc\\nEdge risks & mitigations\\nPulse momentum checkpoints\\nCelebration celebration moment',
                    default: '',
                },
                {
                    key: 'style',
                    type: 'text',
                    label: 'Style note',
                    placeholder: 'radiant clarity',
                    default: 'radiant clarity',
                },
                {
                    key: 'callToAction',
                    type: 'text',
                    label: 'Call to action',
                    placeholder: 'Identify next micro-step',
                    default: 'Identify next micro-step',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const sectionLines = String(config?.sections || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackSections = [
            'Spark focus question',
            'Anchor signals to watch',
            'Rhythm narrative arc',
            'Edge risks & mitigations',
            'Pulse momentum checkpoints',
            'Celebration celebration moment',
            'Allies supportive allies',
            'Next step next experiments',
        ];
                const sections = sectionLines.length > 0 ? sectionLines : fallbackSections;
                const notes = [
            'Invite candour in each section.',
            'Include one delight example.',
            'Balance data with emotion.',
            'Note who to involve early.',
            'Consider pacing for different energy levels.',
            'Mark one bold stretch.',
            'Add a gratitude line.',
            'Keep language human and kind.',
        ];
                const title = String(config?.title || spec.titleFallback || "Creative outline").trim();
                const tone = String(config?.style || spec.styleFallback || "calm confidence").trim();
                const callToAction = String(config?.callToAction || "Identify next micro-step").trim();
                const payloadText = QuickActionTools.toText(clone.payload);
                const preview = payloadText ? payloadText.split(/        ?
        /).slice(0, 4) : [];
                const outline = [];
                outline.push(`${title} — outline (${tone})`);
                outline.push("");
                sections.forEach((section, index) => {
                    outline.push(`${index + 1}. ${section}`);
                    if (notes[index]) {
                        outline.push(`   • ${notes[index]}`);
                    }
                });
                if (preview.length > 0) {
                    outline.push("");
                    outline.push("Payload preview:");
                    preview.forEach(line => outline.push(`   > ${line}`));
                }
                outline.push("");
                outline.push(`Call to action: ${callToAction}`);
                clone.payload = outline.join("
        ");
                clone.vars.lastOutline = { title, sections, tone, callToAction };
                clone.logs.push("Generated outline action block.");
                return [clone];
            }
        },
        {
            id: 'imagination-action-outline-02',
            category: 'action',
            name: 'Grounded framework outline',
            description: 'Shape the payload into a layered outline ready for collaboration.',
            icon: 'layers',
            accent: '#f97316',
            tags: [
                'outline',
                'structure',
                'writing',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                title: 'Grounded framework outline',
                sections: '',
                style: 'steady focus',
                callToAction: 'Identify next micro-step',
            },
            form: [
                {
                    key: 'title',
                    type: 'text',
                    label: 'Outline title',
                    placeholder: 'Grounded framework outline',
                    default: 'Grounded framework outline',
                },
                {
                    key: 'sections',
                    type: 'textarea',
                    rows: 6,
                    label: 'Custom sections',
                    placeholder: 'Spark focus question\\nAnchor signals to watch\\nRhythm narrative arc\\nEdge risks & mitigations\\nPulse momentum checkpoints\\nCelebration celebration moment',
                    default: '',
                },
                {
                    key: 'style',
                    type: 'text',
                    label: 'Style note',
                    placeholder: 'steady focus',
                    default: 'steady focus',
                },
                {
                    key: 'callToAction',
                    type: 'text',
                    label: 'Call to action',
                    placeholder: 'Identify next micro-step',
                    default: 'Identify next micro-step',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const sectionLines = String(config?.sections || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackSections = [
            'Spark focus question',
            'Anchor signals to watch',
            'Rhythm narrative arc',
            'Edge risks & mitigations',
            'Pulse momentum checkpoints',
            'Celebration celebration moment',
            'Allies supportive allies',
            'Next step next experiments',
        ];
                const sections = sectionLines.length > 0 ? sectionLines : fallbackSections;
                const notes = [
            'Invite candour in each section.',
            'Include one delight example.',
            'Balance data with emotion.',
            'Note who to involve early.',
            'Consider pacing for different energy levels.',
            'Mark one bold stretch.',
            'Add a gratitude line.',
            'Keep language human and kind.',
        ];
                const title = String(config?.title || spec.titleFallback || "Creative outline").trim();
                const tone = String(config?.style || spec.styleFallback || "calm confidence").trim();
                const callToAction = String(config?.callToAction || "Identify next micro-step").trim();
                const payloadText = QuickActionTools.toText(clone.payload);
                const preview = payloadText ? payloadText.split(/        ?
        /).slice(0, 4) : [];
                const outline = [];
                outline.push(`${title} — outline (${tone})`);
                outline.push("");
                sections.forEach((section, index) => {
                    outline.push(`${index + 1}. ${section}`);
                    if (notes[index]) {
                        outline.push(`   • ${notes[index]}`);
                    }
                });
                if (preview.length > 0) {
                    outline.push("");
                    outline.push("Payload preview:");
                    preview.forEach(line => outline.push(`   > ${line}`));
                }
                outline.push("");
                outline.push(`Call to action: ${callToAction}`);
                clone.payload = outline.join("
        ");
                clone.vars.lastOutline = { title, sections, tone, callToAction };
                clone.logs.push("Generated outline action block.");
                return [clone];
            }
        },
        {
            id: 'imagination-action-outline-03',
            category: 'action',
            name: 'Playful canvas outline',
            description: 'Shape the payload into a layered outline ready for collaboration.',
            icon: 'layers',
            accent: '#a855f7',
            tags: [
                'outline',
                'structure',
                'writing',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                title: 'Playful canvas outline',
                sections: '',
                style: 'imaginative energy',
                callToAction: 'Identify next micro-step',
            },
            form: [
                {
                    key: 'title',
                    type: 'text',
                    label: 'Outline title',
                    placeholder: 'Playful canvas outline',
                    default: 'Playful canvas outline',
                },
                {
                    key: 'sections',
                    type: 'textarea',
                    rows: 6,
                    label: 'Custom sections',
                    placeholder: 'Spark focus question\\nAnchor signals to watch\\nRhythm narrative arc\\nEdge risks & mitigations\\nPulse momentum checkpoints\\nCelebration celebration moment',
                    default: '',
                },
                {
                    key: 'style',
                    type: 'text',
                    label: 'Style note',
                    placeholder: 'imaginative energy',
                    default: 'imaginative energy',
                },
                {
                    key: 'callToAction',
                    type: 'text',
                    label: 'Call to action',
                    placeholder: 'Identify next micro-step',
                    default: 'Identify next micro-step',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const sectionLines = String(config?.sections || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackSections = [
            'Spark focus question',
            'Anchor signals to watch',
            'Rhythm narrative arc',
            'Edge risks & mitigations',
            'Pulse momentum checkpoints',
            'Celebration celebration moment',
            'Allies supportive allies',
            'Next step next experiments',
        ];
                const sections = sectionLines.length > 0 ? sectionLines : fallbackSections;
                const notes = [
            'Invite candour in each section.',
            'Include one delight example.',
            'Balance data with emotion.',
            'Note who to involve early.',
            'Consider pacing for different energy levels.',
            'Mark one bold stretch.',
            'Add a gratitude line.',
            'Keep language human and kind.',
        ];
                const title = String(config?.title || spec.titleFallback || "Creative outline").trim();
                const tone = String(config?.style || spec.styleFallback || "calm confidence").trim();
                const callToAction = String(config?.callToAction || "Identify next micro-step").trim();
                const payloadText = QuickActionTools.toText(clone.payload);
                const preview = payloadText ? payloadText.split(/        ?
        /).slice(0, 4) : [];
                const outline = [];
                outline.push(`${title} — outline (${tone})`);
                outline.push("");
                sections.forEach((section, index) => {
                    outline.push(`${index + 1}. ${section}`);
                    if (notes[index]) {
                        outline.push(`   • ${notes[index]}`);
                    }
                });
                if (preview.length > 0) {
                    outline.push("");
                    outline.push("Payload preview:");
                    preview.forEach(line => outline.push(`   > ${line}`));
                }
                outline.push("");
                outline.push(`Call to action: ${callToAction}`);
                clone.payload = outline.join("
        ");
                clone.vars.lastOutline = { title, sections, tone, callToAction };
                clone.logs.push("Generated outline action block.");
                return [clone];
            }
        },
        {
            id: 'imagination-action-outline-04',
            category: 'action',
            name: 'Resilient script outline',
            description: 'Shape the payload into a layered outline ready for collaboration.',
            icon: 'layers',
            accent: '#22c55e',
            tags: [
                'outline',
                'structure',
                'writing',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                title: 'Resilient script outline',
                sections: '',
                style: 'quiet determination',
                callToAction: 'Identify next micro-step',
            },
            form: [
                {
                    key: 'title',
                    type: 'text',
                    label: 'Outline title',
                    placeholder: 'Resilient script outline',
                    default: 'Resilient script outline',
                },
                {
                    key: 'sections',
                    type: 'textarea',
                    rows: 6,
                    label: 'Custom sections',
                    placeholder: 'Spark focus question\\nAnchor signals to watch\\nRhythm narrative arc\\nEdge risks & mitigations\\nPulse momentum checkpoints\\nCelebration celebration moment',
                    default: '',
                },
                {
                    key: 'style',
                    type: 'text',
                    label: 'Style note',
                    placeholder: 'quiet determination',
                    default: 'quiet determination',
                },
                {
                    key: 'callToAction',
                    type: 'text',
                    label: 'Call to action',
                    placeholder: 'Identify next micro-step',
                    default: 'Identify next micro-step',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const sectionLines = String(config?.sections || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackSections = [
            'Spark focus question',
            'Anchor signals to watch',
            'Rhythm narrative arc',
            'Edge risks & mitigations',
            'Pulse momentum checkpoints',
            'Celebration celebration moment',
            'Allies supportive allies',
            'Next step next experiments',
        ];
                const sections = sectionLines.length > 0 ? sectionLines : fallbackSections;
                const notes = [
            'Invite candour in each section.',
            'Include one delight example.',
            'Balance data with emotion.',
            'Note who to involve early.',
            'Consider pacing for different energy levels.',
            'Mark one bold stretch.',
            'Add a gratitude line.',
            'Keep language human and kind.',
        ];
                const title = String(config?.title || spec.titleFallback || "Creative outline").trim();
                const tone = String(config?.style || spec.styleFallback || "calm confidence").trim();
                const callToAction = String(config?.callToAction || "Identify next micro-step").trim();
                const payloadText = QuickActionTools.toText(clone.payload);
                const preview = payloadText ? payloadText.split(/        ?
        /).slice(0, 4) : [];
                const outline = [];
                outline.push(`${title} — outline (${tone})`);
                outline.push("");
                sections.forEach((section, index) => {
                    outline.push(`${index + 1}. ${section}`);
                    if (notes[index]) {
                        outline.push(`   • ${notes[index]}`);
                    }
                });
                if (preview.length > 0) {
                    outline.push("");
                    outline.push("Payload preview:");
                    preview.forEach(line => outline.push(`   > ${line}`));
                }
                outline.push("");
                outline.push(`Call to action: ${callToAction}`);
                clone.payload = outline.join("
        ");
                clone.vars.lastOutline = { title, sections, tone, callToAction };
                clone.logs.push("Generated outline action block.");
                return [clone];
            }
        },
        {
            id: 'imagination-action-outline-05',
            category: 'action',
            name: 'Curious matrix outline',
            description: 'Shape the payload into a layered outline ready for collaboration.',
            icon: 'layers',
            accent: '#f59e0b',
            tags: [
                'outline',
                'structure',
                'writing',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                title: 'Curious matrix outline',
                sections: '',
                style: 'exploratory tone',
                callToAction: 'Identify next micro-step',
            },
            form: [
                {
                    key: 'title',
                    type: 'text',
                    label: 'Outline title',
                    placeholder: 'Curious matrix outline',
                    default: 'Curious matrix outline',
                },
                {
                    key: 'sections',
                    type: 'textarea',
                    rows: 6,
                    label: 'Custom sections',
                    placeholder: 'Spark focus question\\nAnchor signals to watch\\nRhythm narrative arc\\nEdge risks & mitigations\\nPulse momentum checkpoints\\nCelebration celebration moment',
                    default: '',
                },
                {
                    key: 'style',
                    type: 'text',
                    label: 'Style note',
                    placeholder: 'exploratory tone',
                    default: 'exploratory tone',
                },
                {
                    key: 'callToAction',
                    type: 'text',
                    label: 'Call to action',
                    placeholder: 'Identify next micro-step',
                    default: 'Identify next micro-step',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const sectionLines = String(config?.sections || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackSections = [
            'Spark focus question',
            'Anchor signals to watch',
            'Rhythm narrative arc',
            'Edge risks & mitigations',
            'Pulse momentum checkpoints',
            'Celebration celebration moment',
            'Allies supportive allies',
            'Next step next experiments',
        ];
                const sections = sectionLines.length > 0 ? sectionLines : fallbackSections;
                const notes = [
            'Invite candour in each section.',
            'Include one delight example.',
            'Balance data with emotion.',
            'Note who to involve early.',
            'Consider pacing for different energy levels.',
            'Mark one bold stretch.',
            'Add a gratitude line.',
            'Keep language human and kind.',
        ];
                const title = String(config?.title || spec.titleFallback || "Creative outline").trim();
                const tone = String(config?.style || spec.styleFallback || "calm confidence").trim();
                const callToAction = String(config?.callToAction || "Identify next micro-step").trim();
                const payloadText = QuickActionTools.toText(clone.payload);
                const preview = payloadText ? payloadText.split(/        ?
        /).slice(0, 4) : [];
                const outline = [];
                outline.push(`${title} — outline (${tone})`);
                outline.push("");
                sections.forEach((section, index) => {
                    outline.push(`${index + 1}. ${section}`);
                    if (notes[index]) {
                        outline.push(`   • ${notes[index]}`);
                    }
                });
                if (preview.length > 0) {
                    outline.push("");
                    outline.push("Payload preview:");
                    preview.forEach(line => outline.push(`   > ${line}`));
                }
                outline.push("");
                outline.push(`Call to action: ${callToAction}`);
                clone.payload = outline.join("
        ");
                clone.vars.lastOutline = { title, sections, tone, callToAction };
                clone.logs.push("Generated outline action block.");
                return [clone];
            }
        },
        {
            id: 'imagination-action-outline-06',
            category: 'action',
            name: 'Soothing journey outline',
            description: 'Shape the payload into a layered outline ready for collaboration.',
            icon: 'layers',
            accent: '#60a5fa',
            tags: [
                'outline',
                'structure',
                'writing',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                title: 'Soothing journey outline',
                sections: '',
                style: 'gentle pacing',
                callToAction: 'Identify next micro-step',
            },
            form: [
                {
                    key: 'title',
                    type: 'text',
                    label: 'Outline title',
                    placeholder: 'Soothing journey outline',
                    default: 'Soothing journey outline',
                },
                {
                    key: 'sections',
                    type: 'textarea',
                    rows: 6,
                    label: 'Custom sections',
                    placeholder: 'Spark focus question\\nAnchor signals to watch\\nRhythm narrative arc\\nEdge risks & mitigations\\nPulse momentum checkpoints\\nCelebration celebration moment',
                    default: '',
                },
                {
                    key: 'style',
                    type: 'text',
                    label: 'Style note',
                    placeholder: 'gentle pacing',
                    default: 'gentle pacing',
                },
                {
                    key: 'callToAction',
                    type: 'text',
                    label: 'Call to action',
                    placeholder: 'Identify next micro-step',
                    default: 'Identify next micro-step',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const sectionLines = String(config?.sections || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackSections = [
            'Spark focus question',
            'Anchor signals to watch',
            'Rhythm narrative arc',
            'Edge risks & mitigations',
            'Pulse momentum checkpoints',
            'Celebration celebration moment',
            'Allies supportive allies',
            'Next step next experiments',
        ];
                const sections = sectionLines.length > 0 ? sectionLines : fallbackSections;
                const notes = [
            'Invite candour in each section.',
            'Include one delight example.',
            'Balance data with emotion.',
            'Note who to involve early.',
            'Consider pacing for different energy levels.',
            'Mark one bold stretch.',
            'Add a gratitude line.',
            'Keep language human and kind.',
        ];
                const title = String(config?.title || spec.titleFallback || "Creative outline").trim();
                const tone = String(config?.style || spec.styleFallback || "calm confidence").trim();
                const callToAction = String(config?.callToAction || "Identify next micro-step").trim();
                const payloadText = QuickActionTools.toText(clone.payload);
                const preview = payloadText ? payloadText.split(/        ?
        /).slice(0, 4) : [];
                const outline = [];
                outline.push(`${title} — outline (${tone})`);
                outline.push("");
                sections.forEach((section, index) => {
                    outline.push(`${index + 1}. ${section}`);
                    if (notes[index]) {
                        outline.push(`   • ${notes[index]}`);
                    }
                });
                if (preview.length > 0) {
                    outline.push("");
                    outline.push("Payload preview:");
                    preview.forEach(line => outline.push(`   > ${line}`));
                }
                outline.push("");
                outline.push(`Call to action: ${callToAction}`);
                clone.payload = outline.join("
        ");
                clone.vars.lastOutline = { title, sections, tone, callToAction };
                clone.logs.push("Generated outline action block.");
                return [clone];
            }
        },
        {
            id: 'imagination-action-outline-07',
            category: 'action',
            name: 'Bold architecture outline',
            description: 'Shape the payload into a layered outline ready for collaboration.',
            icon: 'layers',
            accent: '#ef4444',
            tags: [
                'outline',
                'structure',
                'writing',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                title: 'Bold architecture outline',
                sections: '',
                style: 'energetic tempo',
                callToAction: 'Identify next micro-step',
            },
            form: [
                {
                    key: 'title',
                    type: 'text',
                    label: 'Outline title',
                    placeholder: 'Bold architecture outline',
                    default: 'Bold architecture outline',
                },
                {
                    key: 'sections',
                    type: 'textarea',
                    rows: 6,
                    label: 'Custom sections',
                    placeholder: 'Spark focus question\\nAnchor signals to watch\\nRhythm narrative arc\\nEdge risks & mitigations\\nPulse momentum checkpoints\\nCelebration celebration moment',
                    default: '',
                },
                {
                    key: 'style',
                    type: 'text',
                    label: 'Style note',
                    placeholder: 'energetic tempo',
                    default: 'energetic tempo',
                },
                {
                    key: 'callToAction',
                    type: 'text',
                    label: 'Call to action',
                    placeholder: 'Identify next micro-step',
                    default: 'Identify next micro-step',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const sectionLines = String(config?.sections || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackSections = [
            'Spark focus question',
            'Anchor signals to watch',
            'Rhythm narrative arc',
            'Edge risks & mitigations',
            'Pulse momentum checkpoints',
            'Celebration celebration moment',
            'Allies supportive allies',
            'Next step next experiments',
        ];
                const sections = sectionLines.length > 0 ? sectionLines : fallbackSections;
                const notes = [
            'Invite candour in each section.',
            'Include one delight example.',
            'Balance data with emotion.',
            'Note who to involve early.',
            'Consider pacing for different energy levels.',
            'Mark one bold stretch.',
            'Add a gratitude line.',
            'Keep language human and kind.',
        ];
                const title = String(config?.title || spec.titleFallback || "Creative outline").trim();
                const tone = String(config?.style || spec.styleFallback || "calm confidence").trim();
                const callToAction = String(config?.callToAction || "Identify next micro-step").trim();
                const payloadText = QuickActionTools.toText(clone.payload);
                const preview = payloadText ? payloadText.split(/        ?
        /).slice(0, 4) : [];
                const outline = [];
                outline.push(`${title} — outline (${tone})`);
                outline.push("");
                sections.forEach((section, index) => {
                    outline.push(`${index + 1}. ${section}`);
                    if (notes[index]) {
                        outline.push(`   • ${notes[index]}`);
                    }
                });
                if (preview.length > 0) {
                    outline.push("");
                    outline.push("Payload preview:");
                    preview.forEach(line => outline.push(`   > ${line}`));
                }
                outline.push("");
                outline.push(`Call to action: ${callToAction}`);
                clone.payload = outline.join("
        ");
                clone.vars.lastOutline = { title, sections, tone, callToAction };
                clone.logs.push("Generated outline action block.");
                return [clone];
            }
        },
        {
            id: 'imagination-action-outline-08',
            category: 'action',
            name: 'Delicate manuscript outline',
            description: 'Shape the payload into a layered outline ready for collaboration.',
            icon: 'layers',
            accent: '#c084fc',
            tags: [
                'outline',
                'structure',
                'writing',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                title: 'Delicate manuscript outline',
                sections: '',
                style: 'soft resonance',
                callToAction: 'Identify next micro-step',
            },
            form: [
                {
                    key: 'title',
                    type: 'text',
                    label: 'Outline title',
                    placeholder: 'Delicate manuscript outline',
                    default: 'Delicate manuscript outline',
                },
                {
                    key: 'sections',
                    type: 'textarea',
                    rows: 6,
                    label: 'Custom sections',
                    placeholder: 'Spark focus question\\nAnchor signals to watch\\nRhythm narrative arc\\nEdge risks & mitigations\\nPulse momentum checkpoints\\nCelebration celebration moment',
                    default: '',
                },
                {
                    key: 'style',
                    type: 'text',
                    label: 'Style note',
                    placeholder: 'soft resonance',
                    default: 'soft resonance',
                },
                {
                    key: 'callToAction',
                    type: 'text',
                    label: 'Call to action',
                    placeholder: 'Identify next micro-step',
                    default: 'Identify next micro-step',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const sectionLines = String(config?.sections || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackSections = [
            'Spark focus question',
            'Anchor signals to watch',
            'Rhythm narrative arc',
            'Edge risks & mitigations',
            'Pulse momentum checkpoints',
            'Celebration celebration moment',
            'Allies supportive allies',
            'Next step next experiments',
        ];
                const sections = sectionLines.length > 0 ? sectionLines : fallbackSections;
                const notes = [
            'Invite candour in each section.',
            'Include one delight example.',
            'Balance data with emotion.',
            'Note who to involve early.',
            'Consider pacing for different energy levels.',
            'Mark one bold stretch.',
            'Add a gratitude line.',
            'Keep language human and kind.',
        ];
                const title = String(config?.title || spec.titleFallback || "Creative outline").trim();
                const tone = String(config?.style || spec.styleFallback || "calm confidence").trim();
                const callToAction = String(config?.callToAction || "Identify next micro-step").trim();
                const payloadText = QuickActionTools.toText(clone.payload);
                const preview = payloadText ? payloadText.split(/        ?
        /).slice(0, 4) : [];
                const outline = [];
                outline.push(`${title} — outline (${tone})`);
                outline.push("");
                sections.forEach((section, index) => {
                    outline.push(`${index + 1}. ${section}`);
                    if (notes[index]) {
                        outline.push(`   • ${notes[index]}`);
                    }
                });
                if (preview.length > 0) {
                    outline.push("");
                    outline.push("Payload preview:");
                    preview.forEach(line => outline.push(`   > ${line}`));
                }
                outline.push("");
                outline.push(`Call to action: ${callToAction}`);
                clone.payload = outline.join("
        ");
                clone.vars.lastOutline = { title, sections, tone, callToAction };
                clone.logs.push("Generated outline action block.");
                return [clone];
            }
        },
        {
            id: 'imagination-action-storyboard-01',
            category: 'action',
            name: 'Dawn chapter storyboard',
            description: 'Transform ideas into a collaborative storyboard with beats and tone.',
            icon: 'film',
            accent: '#fde047',
            tags: [
                'story',
                'narrative',
                'creative',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                setting: 'Soft sunrise lab',
                beats: '',
                tone: 'hopeful',
                cliffhanger: 'How does the morning change our view?',
            },
            form: [
                {
                    key: 'setting',
                    type: 'text',
                    label: 'Primary setting',
                    placeholder: 'Soft sunrise lab',
                    default: 'Soft sunrise lab',
                },
                {
                    key: 'beats',
                    type: 'textarea',
                    rows: 6,
                    label: 'Story beats',
                    placeholder: 'Opening beat: Soft sunrise lab comes alive\\nInciting spark invites action\\nA tension emerges from contrasting needs\\nAllies respond with inventive support\\nUnexpected insight reorients the path\\nA pause to honour progress and adjust',
                    default: '',
                },
                {
                    key: 'tone',
                    type: 'text',
                    label: 'Tone',
                    placeholder: 'hopeful',
                    default: 'hopeful',
                },
                {
                    key: 'cliffhanger',
                    type: 'text',
                    label: 'Cliffhanger',
                    placeholder: 'How does the morning change our view?',
                    default: 'How does the morning change our view?',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const beatLines = String(config?.beats || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackBeats = [
            'Opening beat: Soft sunrise lab comes alive',
            'Inciting spark invites action',
            'A tension emerges from contrasting needs',
            'Allies respond with inventive support',
            'Unexpected insight reorients the path',
            'A pause to honour progress and adjust',
        ];
                const beats = beatLines.length > 0 ? beatLines : fallbackBeats;
                const setting = String(config?.setting || spec.settingFallback || "an evolving workspace").trim();
                const tone = String(config?.tone || spec.toneFallback || "hopeful").trim();
                const cliffhanger = String(config?.cliffhanger || "Will momentum continue?").trim();
                const storyboard = [];
                storyboard.push(`Setting: ${setting}`);
                storyboard.push(`Tone: ${tone}`);
                storyboard.push("");
                storyboard.push("Story beats:");
                beats.forEach((beat, index) => storyboard.push(`${index + 1}. ${beat}`));
                storyboard.push("");
                storyboard.push(`Cliffhanger: ${cliffhanger}`);
                clone.payload = storyboard.join("
        ");
                clone.vars.lastStoryboard = { setting, tone, beats, cliffhanger };
                clone.logs.push("Generated storyboard action block.");
                return [clone];
            }
        },
        {
            id: 'imagination-action-storyboard-02',
            category: 'action',
            name: 'Urban echo storyboard',
            description: 'Transform ideas into a collaborative storyboard with beats and tone.',
            icon: 'film',
            accent: '#4ade80',
            tags: [
                'story',
                'narrative',
                'creative',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                setting: 'City rooftop observatory',
                beats: '',
                tone: 'vibrant',
                cliffhanger: 'What happens when the signal fades?',
            },
            form: [
                {
                    key: 'setting',
                    type: 'text',
                    label: 'Primary setting',
                    placeholder: 'City rooftop observatory',
                    default: 'City rooftop observatory',
                },
                {
                    key: 'beats',
                    type: 'textarea',
                    rows: 6,
                    label: 'Story beats',
                    placeholder: 'Opening beat: City rooftop observatory comes alive\\nInciting spark invites action\\nA tension emerges from contrasting needs\\nAllies respond with inventive support\\nUnexpected insight reorients the path\\nA pause to honour progress and adjust',
                    default: '',
                },
                {
                    key: 'tone',
                    type: 'text',
                    label: 'Tone',
                    placeholder: 'vibrant',
                    default: 'vibrant',
                },
                {
                    key: 'cliffhanger',
                    type: 'text',
                    label: 'Cliffhanger',
                    placeholder: 'What happens when the signal fades?',
                    default: 'What happens when the signal fades?',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const beatLines = String(config?.beats || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackBeats = [
            'Opening beat: City rooftop observatory comes alive',
            'Inciting spark invites action',
            'A tension emerges from contrasting needs',
            'Allies respond with inventive support',
            'Unexpected insight reorients the path',
            'A pause to honour progress and adjust',
        ];
                const beats = beatLines.length > 0 ? beatLines : fallbackBeats;
                const setting = String(config?.setting || spec.settingFallback || "an evolving workspace").trim();
                const tone = String(config?.tone || spec.toneFallback || "hopeful").trim();
                const cliffhanger = String(config?.cliffhanger || "Will momentum continue?").trim();
                const storyboard = [];
                storyboard.push(`Setting: ${setting}`);
                storyboard.push(`Tone: ${tone}`);
                storyboard.push("");
                storyboard.push("Story beats:");
                beats.forEach((beat, index) => storyboard.push(`${index + 1}. ${beat}`));
                storyboard.push("");
                storyboard.push(`Cliffhanger: ${cliffhanger}`);
                clone.payload = storyboard.join("
        ");
                clone.vars.lastStoryboard = { setting, tone, beats, cliffhanger };
                clone.logs.push("Generated storyboard action block.");
                return [clone];
            }
        },
        {
            id: 'imagination-action-storyboard-03',
            category: 'action',
            name: 'Midnight atelier storyboard',
            description: 'Transform ideas into a collaborative storyboard with beats and tone.',
            icon: 'film',
            accent: '#2dd4bf',
            tags: [
                'story',
                'narrative',
                'creative',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                setting: 'Late-night maker space',
                beats: '',
                tone: 'reflective',
                cliffhanger: 'Who keeps the lantern lit?',
            },
            form: [
                {
                    key: 'setting',
                    type: 'text',
                    label: 'Primary setting',
                    placeholder: 'Late-night maker space',
                    default: 'Late-night maker space',
                },
                {
                    key: 'beats',
                    type: 'textarea',
                    rows: 6,
                    label: 'Story beats',
                    placeholder: 'Opening beat: Late-night maker space comes alive\\nInciting spark invites action\\nA tension emerges from contrasting needs\\nAllies respond with inventive support\\nUnexpected insight reorients the path\\nA pause to honour progress and adjust',
                    default: '',
                },
                {
                    key: 'tone',
                    type: 'text',
                    label: 'Tone',
                    placeholder: 'reflective',
                    default: 'reflective',
                },
                {
                    key: 'cliffhanger',
                    type: 'text',
                    label: 'Cliffhanger',
                    placeholder: 'Who keeps the lantern lit?',
                    default: 'Who keeps the lantern lit?',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const beatLines = String(config?.beats || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackBeats = [
            'Opening beat: Late-night maker space comes alive',
            'Inciting spark invites action',
            'A tension emerges from contrasting needs',
            'Allies respond with inventive support',
            'Unexpected insight reorients the path',
            'A pause to honour progress and adjust',
        ];
                const beats = beatLines.length > 0 ? beatLines : fallbackBeats;
                const setting = String(config?.setting || spec.settingFallback || "an evolving workspace").trim();
                const tone = String(config?.tone || spec.toneFallback || "hopeful").trim();
                const cliffhanger = String(config?.cliffhanger || "Will momentum continue?").trim();
                const storyboard = [];
                storyboard.push(`Setting: ${setting}`);
                storyboard.push(`Tone: ${tone}`);
                storyboard.push("");
                storyboard.push("Story beats:");
                beats.forEach((beat, index) => storyboard.push(`${index + 1}. ${beat}`));
                storyboard.push("");
                storyboard.push(`Cliffhanger: ${cliffhanger}`);
                clone.payload = storyboard.join("
        ");
                clone.vars.lastStoryboard = { setting, tone, beats, cliffhanger };
                clone.logs.push("Generated storyboard action block.");
                return [clone];
            }
        },
        {
            id: 'imagination-action-storyboard-04',
            category: 'action',
            name: 'Harbour lights storyboard',
            description: 'Transform ideas into a collaborative storyboard with beats and tone.',
            icon: 'film',
            accent: '#fb7185',
            tags: [
                'story',
                'narrative',
                'creative',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                setting: 'Floating community hub',
                beats: '',
                tone: 'curious',
                cliffhanger: 'Will the tide bring new allies?',
            },
            form: [
                {
                    key: 'setting',
                    type: 'text',
                    label: 'Primary setting',
                    placeholder: 'Floating community hub',
                    default: 'Floating community hub',
                },
                {
                    key: 'beats',
                    type: 'textarea',
                    rows: 6,
                    label: 'Story beats',
                    placeholder: 'Opening beat: Floating community hub comes alive\\nInciting spark invites action\\nA tension emerges from contrasting needs\\nAllies respond with inventive support\\nUnexpected insight reorients the path\\nA pause to honour progress and adjust',
                    default: '',
                },
                {
                    key: 'tone',
                    type: 'text',
                    label: 'Tone',
                    placeholder: 'curious',
                    default: 'curious',
                },
                {
                    key: 'cliffhanger',
                    type: 'text',
                    label: 'Cliffhanger',
                    placeholder: 'Will the tide bring new allies?',
                    default: 'Will the tide bring new allies?',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const beatLines = String(config?.beats || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackBeats = [
            'Opening beat: Floating community hub comes alive',
            'Inciting spark invites action',
            'A tension emerges from contrasting needs',
            'Allies respond with inventive support',
            'Unexpected insight reorients the path',
            'A pause to honour progress and adjust',
        ];
                const beats = beatLines.length > 0 ? beatLines : fallbackBeats;
                const setting = String(config?.setting || spec.settingFallback || "an evolving workspace").trim();
                const tone = String(config?.tone || spec.toneFallback || "hopeful").trim();
                const cliffhanger = String(config?.cliffhanger || "Will momentum continue?").trim();
                const storyboard = [];
                storyboard.push(`Setting: ${setting}`);
                storyboard.push(`Tone: ${tone}`);
                storyboard.push("");
                storyboard.push("Story beats:");
                beats.forEach((beat, index) => storyboard.push(`${index + 1}. ${beat}`));
                storyboard.push("");
                storyboard.push(`Cliffhanger: ${cliffhanger}`);
                clone.payload = storyboard.join("
        ");
                clone.vars.lastStoryboard = { setting, tone, beats, cliffhanger };
                clone.logs.push("Generated storyboard action block.");
                return [clone];
            }
        },
        {
            id: 'imagination-action-storyboard-05',
            category: 'action',
            name: 'Forest canopy storyboard',
            description: 'Transform ideas into a collaborative storyboard with beats and tone.',
            icon: 'film',
            accent: '#a3e635',
            tags: [
                'story',
                'narrative',
                'creative',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                setting: 'Treehouse collaboration loft',
                beats: '',
                tone: 'grounded',
                cliffhanger: 'What secret do the leaves whisper?',
            },
            form: [
                {
                    key: 'setting',
                    type: 'text',
                    label: 'Primary setting',
                    placeholder: 'Treehouse collaboration loft',
                    default: 'Treehouse collaboration loft',
                },
                {
                    key: 'beats',
                    type: 'textarea',
                    rows: 6,
                    label: 'Story beats',
                    placeholder: 'Opening beat: Treehouse collaboration loft comes alive\\nInciting spark invites action\\nA tension emerges from contrasting needs\\nAllies respond with inventive support\\nUnexpected insight reorients the path\\nA pause to honour progress and adjust',
                    default: '',
                },
                {
                    key: 'tone',
                    type: 'text',
                    label: 'Tone',
                    placeholder: 'grounded',
                    default: 'grounded',
                },
                {
                    key: 'cliffhanger',
                    type: 'text',
                    label: 'Cliffhanger',
                    placeholder: 'What secret do the leaves whisper?',
                    default: 'What secret do the leaves whisper?',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const beatLines = String(config?.beats || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackBeats = [
            'Opening beat: Treehouse collaboration loft comes alive',
            'Inciting spark invites action',
            'A tension emerges from contrasting needs',
            'Allies respond with inventive support',
            'Unexpected insight reorients the path',
            'A pause to honour progress and adjust',
        ];
                const beats = beatLines.length > 0 ? beatLines : fallbackBeats;
                const setting = String(config?.setting || spec.settingFallback || "an evolving workspace").trim();
                const tone = String(config?.tone || spec.toneFallback || "hopeful").trim();
                const cliffhanger = String(config?.cliffhanger || "Will momentum continue?").trim();
                const storyboard = [];
                storyboard.push(`Setting: ${setting}`);
                storyboard.push(`Tone: ${tone}`);
                storyboard.push("");
                storyboard.push("Story beats:");
                beats.forEach((beat, index) => storyboard.push(`${index + 1}. ${beat}`));
                storyboard.push("");
                storyboard.push(`Cliffhanger: ${cliffhanger}`);
                clone.payload = storyboard.join("
        ");
                clone.vars.lastStoryboard = { setting, tone, beats, cliffhanger };
                clone.logs.push("Generated storyboard action block.");
                return [clone];
            }
        },
        {
            id: 'imagination-action-storyboard-06',
            category: 'action',
            name: 'Desert orbit storyboard',
            description: 'Transform ideas into a collaborative storyboard with beats and tone.',
            icon: 'film',
            accent: '#f97316',
            tags: [
                'story',
                'narrative',
                'creative',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                setting: 'Solar field studio',
                beats: '',
                tone: 'resolute',
                cliffhanger: 'Can momentum survive the heat?',
            },
            form: [
                {
                    key: 'setting',
                    type: 'text',
                    label: 'Primary setting',
                    placeholder: 'Solar field studio',
                    default: 'Solar field studio',
                },
                {
                    key: 'beats',
                    type: 'textarea',
                    rows: 6,
                    label: 'Story beats',
                    placeholder: 'Opening beat: Solar field studio comes alive\\nInciting spark invites action\\nA tension emerges from contrasting needs\\nAllies respond with inventive support\\nUnexpected insight reorients the path\\nA pause to honour progress and adjust',
                    default: '',
                },
                {
                    key: 'tone',
                    type: 'text',
                    label: 'Tone',
                    placeholder: 'resolute',
                    default: 'resolute',
                },
                {
                    key: 'cliffhanger',
                    type: 'text',
                    label: 'Cliffhanger',
                    placeholder: 'Can momentum survive the heat?',
                    default: 'Can momentum survive the heat?',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const beatLines = String(config?.beats || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackBeats = [
            'Opening beat: Solar field studio comes alive',
            'Inciting spark invites action',
            'A tension emerges from contrasting needs',
            'Allies respond with inventive support',
            'Unexpected insight reorients the path',
            'A pause to honour progress and adjust',
        ];
                const beats = beatLines.length > 0 ? beatLines : fallbackBeats;
                const setting = String(config?.setting || spec.settingFallback || "an evolving workspace").trim();
                const tone = String(config?.tone || spec.toneFallback || "hopeful").trim();
                const cliffhanger = String(config?.cliffhanger || "Will momentum continue?").trim();
                const storyboard = [];
                storyboard.push(`Setting: ${setting}`);
                storyboard.push(`Tone: ${tone}`);
                storyboard.push("");
                storyboard.push("Story beats:");
                beats.forEach((beat, index) => storyboard.push(`${index + 1}. ${beat}`));
                storyboard.push("");
                storyboard.push(`Cliffhanger: ${cliffhanger}`);
                clone.payload = storyboard.join("
        ");
                clone.vars.lastStoryboard = { setting, tone, beats, cliffhanger };
                clone.logs.push("Generated storyboard action block.");
                return [clone];
            }
        },
        {
            id: 'imagination-action-agenda-01',
            category: 'action',
            name: 'Alignment cadence agenda',
            description: 'Compose a thoughtful meeting agenda with topics and outcomes.',
            icon: 'clipboard',
            accent: '#0ea5e9',
            tags: [
                'agenda',
                'meeting',
                'planning',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                meetingName: 'Alignment cadence agenda',
                duration: '60 minutes',
                topics: '',
                prework: '',
                outcomes: '',
            },
            form: [
                {
                    key: 'meetingName',
                    type: 'text',
                    label: 'Meeting name',
                    placeholder: 'Alignment cadence agenda',
                    default: 'Alignment cadence agenda',
                },
                {
                    key: 'duration',
                    type: 'text',
                    label: 'Duration',
                    placeholder: '60 minutes',
                    default: '60 minutes',
                },
                {
                    key: 'topics',
                    type: 'textarea',
                    rows: 5,
                    label: 'Topics',
                    placeholder: 'Share context frames\\nReview wins and learnings\\nSurface friction points\\nExplore experiments\\nDecide next commitments\\nAssign support partners',
                    default: '',
                },
                {
                    key: 'prework',
                    type: 'textarea',
                    rows: 4,
                    label: 'Prework',
                    placeholder: 'Read summary document\\nGather one highlight\\nNote one friction point\\nBring a reflection question',
                    default: '',
                },
                {
                    key: 'outcomes',
                    type: 'textarea',
                    rows: 4,
                    label: 'Desired outcomes',
                    placeholder: 'Aligned next step\\nNamed support buddy\\nCaptured learning note',
                    default: '',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const topicLines = String(config?.topics || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackTopics = [
            'Share context frames',
            'Review wins and learnings',
            'Surface friction points',
            'Explore experiments',
            'Decide next commitments',
            'Assign support partners',
        ];
                const topics = topicLines.length > 0 ? topicLines : fallbackTopics;
                const preworkLines = String(config?.prework || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackPrework = [
            'Read summary document',
            'Gather one highlight',
            'Note one friction point',
            'Bring a reflection question',
        ];
                const prework = preworkLines.length > 0 ? preworkLines : fallbackPrework;
                const outcomeLines = String(config?.outcomes || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackOutcomes = [
            'Aligned next step',
            'Named support buddy',
            'Captured learning note',
        ];
                const outcomes = outcomeLines.length > 0 ? outcomeLines : fallbackOutcomes;
                const meetingName = String(config?.meetingName || spec.nameFallback || "Team sync").trim();
                const duration = String(config?.duration || spec.durationFallback || "45 minutes").trim();
                const agenda = [];
                agenda.push(`${meetingName} — agenda (${duration})`);
                agenda.push("");
                agenda.push("Topics:");
                topics.forEach((topic, index) => agenda.push(`${index + 1}. ${topic}`));
                agenda.push("");
                agenda.push("Prework:");
                prework.forEach(item => agenda.push(`- ${item}`));
                agenda.push("");
                agenda.push("Desired outcomes:");
                outcomes.forEach(item => agenda.push(`- ${item}`));
                clone.payload = agenda.join("
        ");
                clone.vars.lastAgenda = { meetingName, duration, topics, prework, outcomes };
                clone.logs.push("Generated agenda action block.");
                return [clone];
            }
        },
        {
            id: 'imagination-action-agenda-02',
            category: 'action',
            name: 'Retrospective reset agenda',
            description: 'Compose a thoughtful meeting agenda with topics and outcomes.',
            icon: 'clipboard',
            accent: '#facc15',
            tags: [
                'agenda',
                'meeting',
                'planning',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                meetingName: 'Retrospective reset agenda',
                duration: '45 minutes',
                topics: '',
                prework: '',
                outcomes: '',
            },
            form: [
                {
                    key: 'meetingName',
                    type: 'text',
                    label: 'Meeting name',
                    placeholder: 'Retrospective reset agenda',
                    default: 'Retrospective reset agenda',
                },
                {
                    key: 'duration',
                    type: 'text',
                    label: 'Duration',
                    placeholder: '45 minutes',
                    default: '45 minutes',
                },
                {
                    key: 'topics',
                    type: 'textarea',
                    rows: 5,
                    label: 'Topics',
                    placeholder: 'Share context frames\\nReview wins and learnings\\nSurface friction points\\nExplore experiments\\nDecide next commitments\\nAssign support partners',
                    default: '',
                },
                {
                    key: 'prework',
                    type: 'textarea',
                    rows: 4,
                    label: 'Prework',
                    placeholder: 'Read summary document\\nGather one highlight\\nNote one friction point\\nBring a reflection question',
                    default: '',
                },
                {
                    key: 'outcomes',
                    type: 'textarea',
                    rows: 4,
                    label: 'Desired outcomes',
                    placeholder: 'Aligned next step\\nNamed support buddy\\nCaptured learning note',
                    default: '',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const topicLines = String(config?.topics || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackTopics = [
            'Share context frames',
            'Review wins and learnings',
            'Surface friction points',
            'Explore experiments',
            'Decide next commitments',
            'Assign support partners',
        ];
                const topics = topicLines.length > 0 ? topicLines : fallbackTopics;
                const preworkLines = String(config?.prework || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackPrework = [
            'Read summary document',
            'Gather one highlight',
            'Note one friction point',
            'Bring a reflection question',
        ];
                const prework = preworkLines.length > 0 ? preworkLines : fallbackPrework;
                const outcomeLines = String(config?.outcomes || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackOutcomes = [
            'Aligned next step',
            'Named support buddy',
            'Captured learning note',
        ];
                const outcomes = outcomeLines.length > 0 ? outcomeLines : fallbackOutcomes;
                const meetingName = String(config?.meetingName || spec.nameFallback || "Team sync").trim();
                const duration = String(config?.duration || spec.durationFallback || "45 minutes").trim();
                const agenda = [];
                agenda.push(`${meetingName} — agenda (${duration})`);
                agenda.push("");
                agenda.push("Topics:");
                topics.forEach((topic, index) => agenda.push(`${index + 1}. ${topic}`));
                agenda.push("");
                agenda.push("Prework:");
                prework.forEach(item => agenda.push(`- ${item}`));
                agenda.push("");
                agenda.push("Desired outcomes:");
                outcomes.forEach(item => agenda.push(`- ${item}`));
                clone.payload = agenda.join("
        ");
                clone.vars.lastAgenda = { meetingName, duration, topics, prework, outcomes };
                clone.logs.push("Generated agenda action block.");
                return [clone];
            }
        },
        {
            id: 'imagination-action-agenda-03',
            category: 'action',
            name: 'Brainstorm studio agenda',
            description: 'Compose a thoughtful meeting agenda with topics and outcomes.',
            icon: 'clipboard',
            accent: '#f472b6',
            tags: [
                'agenda',
                'meeting',
                'planning',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                meetingName: 'Brainstorm studio agenda',
                duration: '50 minutes',
                topics: '',
                prework: '',
                outcomes: '',
            },
            form: [
                {
                    key: 'meetingName',
                    type: 'text',
                    label: 'Meeting name',
                    placeholder: 'Brainstorm studio agenda',
                    default: 'Brainstorm studio agenda',
                },
                {
                    key: 'duration',
                    type: 'text',
                    label: 'Duration',
                    placeholder: '50 minutes',
                    default: '50 minutes',
                },
                {
                    key: 'topics',
                    type: 'textarea',
                    rows: 5,
                    label: 'Topics',
                    placeholder: 'Share context frames\\nReview wins and learnings\\nSurface friction points\\nExplore experiments\\nDecide next commitments\\nAssign support partners',
                    default: '',
                },
                {
                    key: 'prework',
                    type: 'textarea',
                    rows: 4,
                    label: 'Prework',
                    placeholder: 'Read summary document\\nGather one highlight\\nNote one friction point\\nBring a reflection question',
                    default: '',
                },
                {
                    key: 'outcomes',
                    type: 'textarea',
                    rows: 4,
                    label: 'Desired outcomes',
                    placeholder: 'Aligned next step\\nNamed support buddy\\nCaptured learning note',
                    default: '',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const topicLines = String(config?.topics || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackTopics = [
            'Share context frames',
            'Review wins and learnings',
            'Surface friction points',
            'Explore experiments',
            'Decide next commitments',
            'Assign support partners',
        ];
                const topics = topicLines.length > 0 ? topicLines : fallbackTopics;
                const preworkLines = String(config?.prework || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackPrework = [
            'Read summary document',
            'Gather one highlight',
            'Note one friction point',
            'Bring a reflection question',
        ];
                const prework = preworkLines.length > 0 ? preworkLines : fallbackPrework;
                const outcomeLines = String(config?.outcomes || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackOutcomes = [
            'Aligned next step',
            'Named support buddy',
            'Captured learning note',
        ];
                const outcomes = outcomeLines.length > 0 ? outcomeLines : fallbackOutcomes;
                const meetingName = String(config?.meetingName || spec.nameFallback || "Team sync").trim();
                const duration = String(config?.duration || spec.durationFallback || "45 minutes").trim();
                const agenda = [];
                agenda.push(`${meetingName} — agenda (${duration})`);
                agenda.push("");
                agenda.push("Topics:");
                topics.forEach((topic, index) => agenda.push(`${index + 1}. ${topic}`));
                agenda.push("");
                agenda.push("Prework:");
                prework.forEach(item => agenda.push(`- ${item}`));
                agenda.push("");
                agenda.push("Desired outcomes:");
                outcomes.forEach(item => agenda.push(`- ${item}`));
                clone.payload = agenda.join("
        ");
                clone.vars.lastAgenda = { meetingName, duration, topics, prework, outcomes };
                clone.logs.push("Generated agenda action block.");
                return [clone];
            }
        },
        {
            id: 'imagination-action-agenda-04',
            category: 'action',
            name: 'Operations scan agenda',
            description: 'Compose a thoughtful meeting agenda with topics and outcomes.',
            icon: 'clipboard',
            accent: '#34d399',
            tags: [
                'agenda',
                'meeting',
                'planning',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                meetingName: 'Operations scan agenda',
                duration: '40 minutes',
                topics: '',
                prework: '',
                outcomes: '',
            },
            form: [
                {
                    key: 'meetingName',
                    type: 'text',
                    label: 'Meeting name',
                    placeholder: 'Operations scan agenda',
                    default: 'Operations scan agenda',
                },
                {
                    key: 'duration',
                    type: 'text',
                    label: 'Duration',
                    placeholder: '40 minutes',
                    default: '40 minutes',
                },
                {
                    key: 'topics',
                    type: 'textarea',
                    rows: 5,
                    label: 'Topics',
                    placeholder: 'Share context frames\\nReview wins and learnings\\nSurface friction points\\nExplore experiments\\nDecide next commitments\\nAssign support partners',
                    default: '',
                },
                {
                    key: 'prework',
                    type: 'textarea',
                    rows: 4,
                    label: 'Prework',
                    placeholder: 'Read summary document\\nGather one highlight\\nNote one friction point\\nBring a reflection question',
                    default: '',
                },
                {
                    key: 'outcomes',
                    type: 'textarea',
                    rows: 4,
                    label: 'Desired outcomes',
                    placeholder: 'Aligned next step\\nNamed support buddy\\nCaptured learning note',
                    default: '',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const topicLines = String(config?.topics || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackTopics = [
            'Share context frames',
            'Review wins and learnings',
            'Surface friction points',
            'Explore experiments',
            'Decide next commitments',
            'Assign support partners',
        ];
                const topics = topicLines.length > 0 ? topicLines : fallbackTopics;
                const preworkLines = String(config?.prework || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackPrework = [
            'Read summary document',
            'Gather one highlight',
            'Note one friction point',
            'Bring a reflection question',
        ];
                const prework = preworkLines.length > 0 ? preworkLines : fallbackPrework;
                const outcomeLines = String(config?.outcomes || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackOutcomes = [
            'Aligned next step',
            'Named support buddy',
            'Captured learning note',
        ];
                const outcomes = outcomeLines.length > 0 ? outcomeLines : fallbackOutcomes;
                const meetingName = String(config?.meetingName || spec.nameFallback || "Team sync").trim();
                const duration = String(config?.duration || spec.durationFallback || "45 minutes").trim();
                const agenda = [];
                agenda.push(`${meetingName} — agenda (${duration})`);
                agenda.push("");
                agenda.push("Topics:");
                topics.forEach((topic, index) => agenda.push(`${index + 1}. ${topic}`));
                agenda.push("");
                agenda.push("Prework:");
                prework.forEach(item => agenda.push(`- ${item}`));
                agenda.push("");
                agenda.push("Desired outcomes:");
                outcomes.forEach(item => agenda.push(`- ${item}`));
                clone.payload = agenda.join("
        ");
                clone.vars.lastAgenda = { meetingName, duration, topics, prework, outcomes };
                clone.logs.push("Generated agenda action block.");
                return [clone];
            }
        },
        {
            id: 'imagination-action-agenda-05',
            category: 'action',
            name: 'Design spotlight agenda',
            description: 'Compose a thoughtful meeting agenda with topics and outcomes.',
            icon: 'clipboard',
            accent: '#60a5fa',
            tags: [
                'agenda',
                'meeting',
                'planning',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                meetingName: 'Design spotlight agenda',
                duration: '55 minutes',
                topics: '',
                prework: '',
                outcomes: '',
            },
            form: [
                {
                    key: 'meetingName',
                    type: 'text',
                    label: 'Meeting name',
                    placeholder: 'Design spotlight agenda',
                    default: 'Design spotlight agenda',
                },
                {
                    key: 'duration',
                    type: 'text',
                    label: 'Duration',
                    placeholder: '55 minutes',
                    default: '55 minutes',
                },
                {
                    key: 'topics',
                    type: 'textarea',
                    rows: 5,
                    label: 'Topics',
                    placeholder: 'Share context frames\\nReview wins and learnings\\nSurface friction points\\nExplore experiments\\nDecide next commitments\\nAssign support partners',
                    default: '',
                },
                {
                    key: 'prework',
                    type: 'textarea',
                    rows: 4,
                    label: 'Prework',
                    placeholder: 'Read summary document\\nGather one highlight\\nNote one friction point\\nBring a reflection question',
                    default: '',
                },
                {
                    key: 'outcomes',
                    type: 'textarea',
                    rows: 4,
                    label: 'Desired outcomes',
                    placeholder: 'Aligned next step\\nNamed support buddy\\nCaptured learning note',
                    default: '',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const topicLines = String(config?.topics || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackTopics = [
            'Share context frames',
            'Review wins and learnings',
            'Surface friction points',
            'Explore experiments',
            'Decide next commitments',
            'Assign support partners',
        ];
                const topics = topicLines.length > 0 ? topicLines : fallbackTopics;
                const preworkLines = String(config?.prework || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackPrework = [
            'Read summary document',
            'Gather one highlight',
            'Note one friction point',
            'Bring a reflection question',
        ];
                const prework = preworkLines.length > 0 ? preworkLines : fallbackPrework;
                const outcomeLines = String(config?.outcomes || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackOutcomes = [
            'Aligned next step',
            'Named support buddy',
            'Captured learning note',
        ];
                const outcomes = outcomeLines.length > 0 ? outcomeLines : fallbackOutcomes;
                const meetingName = String(config?.meetingName || spec.nameFallback || "Team sync").trim();
                const duration = String(config?.duration || spec.durationFallback || "45 minutes").trim();
                const agenda = [];
                agenda.push(`${meetingName} — agenda (${duration})`);
                agenda.push("");
                agenda.push("Topics:");
                topics.forEach((topic, index) => agenda.push(`${index + 1}. ${topic}`));
                agenda.push("");
                agenda.push("Prework:");
                prework.forEach(item => agenda.push(`- ${item}`));
                agenda.push("");
                agenda.push("Desired outcomes:");
                outcomes.forEach(item => agenda.push(`- ${item}`));
                clone.payload = agenda.join("
        ");
                clone.vars.lastAgenda = { meetingName, duration, topics, prework, outcomes };
                clone.logs.push("Generated agenda action block.");
                return [clone];
            }
        },
        {
            id: 'imagination-action-agenda-06',
            category: 'action',
            name: 'Care circle agenda',
            description: 'Compose a thoughtful meeting agenda with topics and outcomes.',
            icon: 'clipboard',
            accent: '#fb7185',
            tags: [
                'agenda',
                'meeting',
                'planning',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                meetingName: 'Care circle agenda',
                duration: '35 minutes',
                topics: '',
                prework: '',
                outcomes: '',
            },
            form: [
                {
                    key: 'meetingName',
                    type: 'text',
                    label: 'Meeting name',
                    placeholder: 'Care circle agenda',
                    default: 'Care circle agenda',
                },
                {
                    key: 'duration',
                    type: 'text',
                    label: 'Duration',
                    placeholder: '35 minutes',
                    default: '35 minutes',
                },
                {
                    key: 'topics',
                    type: 'textarea',
                    rows: 5,
                    label: 'Topics',
                    placeholder: 'Share context frames\\nReview wins and learnings\\nSurface friction points\\nExplore experiments\\nDecide next commitments\\nAssign support partners',
                    default: '',
                },
                {
                    key: 'prework',
                    type: 'textarea',
                    rows: 4,
                    label: 'Prework',
                    placeholder: 'Read summary document\\nGather one highlight\\nNote one friction point\\nBring a reflection question',
                    default: '',
                },
                {
                    key: 'outcomes',
                    type: 'textarea',
                    rows: 4,
                    label: 'Desired outcomes',
                    placeholder: 'Aligned next step\\nNamed support buddy\\nCaptured learning note',
                    default: '',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const topicLines = String(config?.topics || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackTopics = [
            'Share context frames',
            'Review wins and learnings',
            'Surface friction points',
            'Explore experiments',
            'Decide next commitments',
            'Assign support partners',
        ];
                const topics = topicLines.length > 0 ? topicLines : fallbackTopics;
                const preworkLines = String(config?.prework || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackPrework = [
            'Read summary document',
            'Gather one highlight',
            'Note one friction point',
            'Bring a reflection question',
        ];
                const prework = preworkLines.length > 0 ? preworkLines : fallbackPrework;
                const outcomeLines = String(config?.outcomes || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackOutcomes = [
            'Aligned next step',
            'Named support buddy',
            'Captured learning note',
        ];
                const outcomes = outcomeLines.length > 0 ? outcomeLines : fallbackOutcomes;
                const meetingName = String(config?.meetingName || spec.nameFallback || "Team sync").trim();
                const duration = String(config?.duration || spec.durationFallback || "45 minutes").trim();
                const agenda = [];
                agenda.push(`${meetingName} — agenda (${duration})`);
                agenda.push("");
                agenda.push("Topics:");
                topics.forEach((topic, index) => agenda.push(`${index + 1}. ${topic}`));
                agenda.push("");
                agenda.push("Prework:");
                prework.forEach(item => agenda.push(`- ${item}`));
                agenda.push("");
                agenda.push("Desired outcomes:");
                outcomes.forEach(item => agenda.push(`- ${item}`));
                clone.payload = agenda.join("
        ");
                clone.vars.lastAgenda = { meetingName, duration, topics, prework, outcomes };
                clone.logs.push("Generated agenda action block.");
                return [clone];
            }
        },
        {
            id: 'imagination-action-journey-01',
            category: 'action',
            name: 'Newcomer welcome journey',
            description: 'Map stages, emotions, and opportunities for a key persona journey.',
            icon: 'map',
            accent: '#22d3ee',
            tags: [
                'journey',
                'strategy',
                'empathy',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                persona: 'Warm welcome guide',
                stages: '',
                emotions: '',
                opportunities: '',
            },
            form: [
                {
                    key: 'persona',
                    type: 'text',
                    label: 'Persona',
                    placeholder: 'Warm welcome guide',
                    default: 'Warm welcome guide',
                },
                {
                    key: 'stages',
                    type: 'textarea',
                    rows: 6,
                    label: 'Journey stages',
                    placeholder: 'Arrival moment\\nOrientation support\\nActive exploration\\nConnection boost\\nReflection window\\nRenewed commitment',
                    default: '',
                },
                {
                    key: 'emotions',
                    type: 'textarea',
                    rows: 6,
                    label: 'Emotions',
                    placeholder: 'Curious anticipation\\nSlight overwhelm easing\\nSpark of possibility\\nFeeling seen and backed\\nSettled confidence\\nMotivated to share',
                    default: '',
                },
                {
                    key: 'opportunities',
                    type: 'textarea',
                    rows: 6,
                    label: 'Opportunities',
                    placeholder: 'Clarify invitation message\\nPair with a friendly buddy\\nHighlight creative playground\\nCelebrate community wins\\nOffer reflective prompts\\nInvite future collaboration',
                    default: '',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const stageLines = String(config?.stages || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackStages = [
            'Arrival moment',
            'Orientation support',
            'Active exploration',
            'Connection boost',
            'Reflection window',
            'Renewed commitment',
        ];
                const stages = stageLines.length > 0 ? stageLines : fallbackStages;
                const emotionLines = String(config?.emotions || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackEmotions = [
            'Curious anticipation',
            'Slight overwhelm easing',
            'Spark of possibility',
            'Feeling seen and backed',
            'Settled confidence',
            'Motivated to share',
        ];
                const emotions = emotionLines.length > 0 ? emotionLines : fallbackEmotions;
                const opportunityLines = String(config?.opportunities || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackOpportunities = [
            'Clarify invitation message',
            'Pair with a friendly buddy',
            'Highlight creative playground',
            'Celebrate community wins',
            'Offer reflective prompts',
            'Invite future collaboration',
        ];
                const opportunities = opportunityLines.length > 0 ? opportunityLines : fallbackOpportunities;
                const persona = String(config?.persona || spec.personaFallback || "Curious explorer").trim();
                const journey = [];
                journey.push(`Journey map — persona: ${persona}`);
                journey.push("");
                stages.forEach((stage, index) => {
                    journey.push(`${index + 1}. ${stage}`);
                    if (emotions[index]) journey.push(`   • Emotion: ${emotions[index]}`);
                    if (opportunities[index]) journey.push(`   • Opportunity: ${opportunities[index]}`);
                });
                clone.payload = journey.join("
        ");
                clone.vars.lastJourney = { persona, stages, emotions, opportunities };
                clone.logs.push("Generated journey map action block.");
                return [clone];
            }
        },
        {
            id: 'imagination-action-journey-02',
            category: 'action',
            name: 'Creator launch journey',
            description: 'Map stages, emotions, and opportunities for a key persona journey.',
            icon: 'map',
            accent: '#f87171',
            tags: [
                'journey',
                'strategy',
                'empathy',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                persona: 'Creative founder',
                stages: '',
                emotions: '',
                opportunities: '',
            },
            form: [
                {
                    key: 'persona',
                    type: 'text',
                    label: 'Persona',
                    placeholder: 'Creative founder',
                    default: 'Creative founder',
                },
                {
                    key: 'stages',
                    type: 'textarea',
                    rows: 6,
                    label: 'Journey stages',
                    placeholder: 'Arrival moment\\nOrientation support\\nActive exploration\\nConnection boost\\nReflection window\\nRenewed commitment',
                    default: '',
                },
                {
                    key: 'emotions',
                    type: 'textarea',
                    rows: 6,
                    label: 'Emotions',
                    placeholder: 'Curious anticipation\\nSlight overwhelm easing\\nSpark of possibility\\nFeeling seen and backed\\nSettled confidence\\nMotivated to share',
                    default: '',
                },
                {
                    key: 'opportunities',
                    type: 'textarea',
                    rows: 6,
                    label: 'Opportunities',
                    placeholder: 'Clarify invitation message\\nPair with a friendly buddy\\nHighlight creative playground\\nCelebrate community wins\\nOffer reflective prompts\\nInvite future collaboration',
                    default: '',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const stageLines = String(config?.stages || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackStages = [
            'Arrival moment',
            'Orientation support',
            'Active exploration',
            'Connection boost',
            'Reflection window',
            'Renewed commitment',
        ];
                const stages = stageLines.length > 0 ? stageLines : fallbackStages;
                const emotionLines = String(config?.emotions || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackEmotions = [
            'Curious anticipation',
            'Slight overwhelm easing',
            'Spark of possibility',
            'Feeling seen and backed',
            'Settled confidence',
            'Motivated to share',
        ];
                const emotions = emotionLines.length > 0 ? emotionLines : fallbackEmotions;
                const opportunityLines = String(config?.opportunities || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackOpportunities = [
            'Clarify invitation message',
            'Pair with a friendly buddy',
            'Highlight creative playground',
            'Celebrate community wins',
            'Offer reflective prompts',
            'Invite future collaboration',
        ];
                const opportunities = opportunityLines.length > 0 ? opportunityLines : fallbackOpportunities;
                const persona = String(config?.persona || spec.personaFallback || "Curious explorer").trim();
                const journey = [];
                journey.push(`Journey map — persona: ${persona}`);
                journey.push("");
                stages.forEach((stage, index) => {
                    journey.push(`${index + 1}. ${stage}`);
                    if (emotions[index]) journey.push(`   • Emotion: ${emotions[index]}`);
                    if (opportunities[index]) journey.push(`   • Opportunity: ${opportunities[index]}`);
                });
                clone.payload = journey.join("
        ");
                clone.vars.lastJourney = { persona, stages, emotions, opportunities };
                clone.logs.push("Generated journey map action block.");
                return [clone];
            }
        },
        {
            id: 'imagination-action-journey-03',
            category: 'action',
            name: 'Mentor support journey',
            description: 'Map stages, emotions, and opportunities for a key persona journey.',
            icon: 'map',
            accent: '#8b5cf6',
            tags: [
                'journey',
                'strategy',
                'empathy',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                persona: 'Guiding mentor',
                stages: '',
                emotions: '',
                opportunities: '',
            },
            form: [
                {
                    key: 'persona',
                    type: 'text',
                    label: 'Persona',
                    placeholder: 'Guiding mentor',
                    default: 'Guiding mentor',
                },
                {
                    key: 'stages',
                    type: 'textarea',
                    rows: 6,
                    label: 'Journey stages',
                    placeholder: 'Arrival moment\\nOrientation support\\nActive exploration\\nConnection boost\\nReflection window\\nRenewed commitment',
                    default: '',
                },
                {
                    key: 'emotions',
                    type: 'textarea',
                    rows: 6,
                    label: 'Emotions',
                    placeholder: 'Curious anticipation\\nSlight overwhelm easing\\nSpark of possibility\\nFeeling seen and backed\\nSettled confidence\\nMotivated to share',
                    default: '',
                },
                {
                    key: 'opportunities',
                    type: 'textarea',
                    rows: 6,
                    label: 'Opportunities',
                    placeholder: 'Clarify invitation message\\nPair with a friendly buddy\\nHighlight creative playground\\nCelebrate community wins\\nOffer reflective prompts\\nInvite future collaboration',
                    default: '',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const stageLines = String(config?.stages || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackStages = [
            'Arrival moment',
            'Orientation support',
            'Active exploration',
            'Connection boost',
            'Reflection window',
            'Renewed commitment',
        ];
                const stages = stageLines.length > 0 ? stageLines : fallbackStages;
                const emotionLines = String(config?.emotions || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackEmotions = [
            'Curious anticipation',
            'Slight overwhelm easing',
            'Spark of possibility',
            'Feeling seen and backed',
            'Settled confidence',
            'Motivated to share',
        ];
                const emotions = emotionLines.length > 0 ? emotionLines : fallbackEmotions;
                const opportunityLines = String(config?.opportunities || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackOpportunities = [
            'Clarify invitation message',
            'Pair with a friendly buddy',
            'Highlight creative playground',
            'Celebrate community wins',
            'Offer reflective prompts',
            'Invite future collaboration',
        ];
                const opportunities = opportunityLines.length > 0 ? opportunityLines : fallbackOpportunities;
                const persona = String(config?.persona || spec.personaFallback || "Curious explorer").trim();
                const journey = [];
                journey.push(`Journey map — persona: ${persona}`);
                journey.push("");
                stages.forEach((stage, index) => {
                    journey.push(`${index + 1}. ${stage}`);
                    if (emotions[index]) journey.push(`   • Emotion: ${emotions[index]}`);
                    if (opportunities[index]) journey.push(`   • Opportunity: ${opportunities[index]}`);
                });
                clone.payload = journey.join("
        ");
                clone.vars.lastJourney = { persona, stages, emotions, opportunities };
                clone.logs.push("Generated journey map action block.");
                return [clone];
            }
        },
        {
            id: 'imagination-action-journey-04',
            category: 'action',
            name: 'Community uplift journey',
            description: 'Map stages, emotions, and opportunities for a key persona journey.',
            icon: 'map',
            accent: '#0ea5e9',
            tags: [
                'journey',
                'strategy',
                'empathy',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                persona: 'Community caretaker',
                stages: '',
                emotions: '',
                opportunities: '',
            },
            form: [
                {
                    key: 'persona',
                    type: 'text',
                    label: 'Persona',
                    placeholder: 'Community caretaker',
                    default: 'Community caretaker',
                },
                {
                    key: 'stages',
                    type: 'textarea',
                    rows: 6,
                    label: 'Journey stages',
                    placeholder: 'Arrival moment\\nOrientation support\\nActive exploration\\nConnection boost\\nReflection window\\nRenewed commitment',
                    default: '',
                },
                {
                    key: 'emotions',
                    type: 'textarea',
                    rows: 6,
                    label: 'Emotions',
                    placeholder: 'Curious anticipation\\nSlight overwhelm easing\\nSpark of possibility\\nFeeling seen and backed\\nSettled confidence\\nMotivated to share',
                    default: '',
                },
                {
                    key: 'opportunities',
                    type: 'textarea',
                    rows: 6,
                    label: 'Opportunities',
                    placeholder: 'Clarify invitation message\\nPair with a friendly buddy\\nHighlight creative playground\\nCelebrate community wins\\nOffer reflective prompts\\nInvite future collaboration',
                    default: '',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const stageLines = String(config?.stages || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackStages = [
            'Arrival moment',
            'Orientation support',
            'Active exploration',
            'Connection boost',
            'Reflection window',
            'Renewed commitment',
        ];
                const stages = stageLines.length > 0 ? stageLines : fallbackStages;
                const emotionLines = String(config?.emotions || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackEmotions = [
            'Curious anticipation',
            'Slight overwhelm easing',
            'Spark of possibility',
            'Feeling seen and backed',
            'Settled confidence',
            'Motivated to share',
        ];
                const emotions = emotionLines.length > 0 ? emotionLines : fallbackEmotions;
                const opportunityLines = String(config?.opportunities || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackOpportunities = [
            'Clarify invitation message',
            'Pair with a friendly buddy',
            'Highlight creative playground',
            'Celebrate community wins',
            'Offer reflective prompts',
            'Invite future collaboration',
        ];
                const opportunities = opportunityLines.length > 0 ? opportunityLines : fallbackOpportunities;
                const persona = String(config?.persona || spec.personaFallback || "Curious explorer").trim();
                const journey = [];
                journey.push(`Journey map — persona: ${persona}`);
                journey.push("");
                stages.forEach((stage, index) => {
                    journey.push(`${index + 1}. ${stage}`);
                    if (emotions[index]) journey.push(`   • Emotion: ${emotions[index]}`);
                    if (opportunities[index]) journey.push(`   • Opportunity: ${opportunities[index]}`);
                });
                clone.payload = journey.join("
        ");
                clone.vars.lastJourney = { persona, stages, emotions, opportunities };
                clone.logs.push("Generated journey map action block.");
                return [clone];
            }
        },
        {
            id: 'imagination-action-journey-05',
            category: 'action',
            name: 'Repair trust journey',
            description: 'Map stages, emotions, and opportunities for a key persona journey.',
            icon: 'map',
            accent: '#10b981',
            tags: [
                'journey',
                'strategy',
                'empathy',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                persona: 'Trust repair steward',
                stages: '',
                emotions: '',
                opportunities: '',
            },
            form: [
                {
                    key: 'persona',
                    type: 'text',
                    label: 'Persona',
                    placeholder: 'Trust repair steward',
                    default: 'Trust repair steward',
                },
                {
                    key: 'stages',
                    type: 'textarea',
                    rows: 6,
                    label: 'Journey stages',
                    placeholder: 'Arrival moment\\nOrientation support\\nActive exploration\\nConnection boost\\nReflection window\\nRenewed commitment',
                    default: '',
                },
                {
                    key: 'emotions',
                    type: 'textarea',
                    rows: 6,
                    label: 'Emotions',
                    placeholder: 'Curious anticipation\\nSlight overwhelm easing\\nSpark of possibility\\nFeeling seen and backed\\nSettled confidence\\nMotivated to share',
                    default: '',
                },
                {
                    key: 'opportunities',
                    type: 'textarea',
                    rows: 6,
                    label: 'Opportunities',
                    placeholder: 'Clarify invitation message\\nPair with a friendly buddy\\nHighlight creative playground\\nCelebrate community wins\\nOffer reflective prompts\\nInvite future collaboration',
                    default: '',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const stageLines = String(config?.stages || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackStages = [
            'Arrival moment',
            'Orientation support',
            'Active exploration',
            'Connection boost',
            'Reflection window',
            'Renewed commitment',
        ];
                const stages = stageLines.length > 0 ? stageLines : fallbackStages;
                const emotionLines = String(config?.emotions || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackEmotions = [
            'Curious anticipation',
            'Slight overwhelm easing',
            'Spark of possibility',
            'Feeling seen and backed',
            'Settled confidence',
            'Motivated to share',
        ];
                const emotions = emotionLines.length > 0 ? emotionLines : fallbackEmotions;
                const opportunityLines = String(config?.opportunities || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackOpportunities = [
            'Clarify invitation message',
            'Pair with a friendly buddy',
            'Highlight creative playground',
            'Celebrate community wins',
            'Offer reflective prompts',
            'Invite future collaboration',
        ];
                const opportunities = opportunityLines.length > 0 ? opportunityLines : fallbackOpportunities;
                const persona = String(config?.persona || spec.personaFallback || "Curious explorer").trim();
                const journey = [];
                journey.push(`Journey map — persona: ${persona}`);
                journey.push("");
                stages.forEach((stage, index) => {
                    journey.push(`${index + 1}. ${stage}`);
                    if (emotions[index]) journey.push(`   • Emotion: ${emotions[index]}`);
                    if (opportunities[index]) journey.push(`   • Opportunity: ${opportunities[index]}`);
                });
                clone.payload = journey.join("
        ");
                clone.vars.lastJourney = { persona, stages, emotions, opportunities };
                clone.logs.push("Generated journey map action block.");
                return [clone];
            }
        },
        {
            id: 'imagination-action-journey-06',
            category: 'action',
            name: 'Expansion scouting journey',
            description: 'Map stages, emotions, and opportunities for a key persona journey.',
            icon: 'map',
            accent: '#f97316',
            tags: [
                'journey',
                'strategy',
                'empathy',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                persona: 'Opportunity scout',
                stages: '',
                emotions: '',
                opportunities: '',
            },
            form: [
                {
                    key: 'persona',
                    type: 'text',
                    label: 'Persona',
                    placeholder: 'Opportunity scout',
                    default: 'Opportunity scout',
                },
                {
                    key: 'stages',
                    type: 'textarea',
                    rows: 6,
                    label: 'Journey stages',
                    placeholder: 'Arrival moment\\nOrientation support\\nActive exploration\\nConnection boost\\nReflection window\\nRenewed commitment',
                    default: '',
                },
                {
                    key: 'emotions',
                    type: 'textarea',
                    rows: 6,
                    label: 'Emotions',
                    placeholder: 'Curious anticipation\\nSlight overwhelm easing\\nSpark of possibility\\nFeeling seen and backed\\nSettled confidence\\nMotivated to share',
                    default: '',
                },
                {
                    key: 'opportunities',
                    type: 'textarea',
                    rows: 6,
                    label: 'Opportunities',
                    placeholder: 'Clarify invitation message\\nPair with a friendly buddy\\nHighlight creative playground\\nCelebrate community wins\\nOffer reflective prompts\\nInvite future collaboration',
                    default: '',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const stageLines = String(config?.stages || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackStages = [
            'Arrival moment',
            'Orientation support',
            'Active exploration',
            'Connection boost',
            'Reflection window',
            'Renewed commitment',
        ];
                const stages = stageLines.length > 0 ? stageLines : fallbackStages;
                const emotionLines = String(config?.emotions || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackEmotions = [
            'Curious anticipation',
            'Slight overwhelm easing',
            'Spark of possibility',
            'Feeling seen and backed',
            'Settled confidence',
            'Motivated to share',
        ];
                const emotions = emotionLines.length > 0 ? emotionLines : fallbackEmotions;
                const opportunityLines = String(config?.opportunities || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackOpportunities = [
            'Clarify invitation message',
            'Pair with a friendly buddy',
            'Highlight creative playground',
            'Celebrate community wins',
            'Offer reflective prompts',
            'Invite future collaboration',
        ];
                const opportunities = opportunityLines.length > 0 ? opportunityLines : fallbackOpportunities;
                const persona = String(config?.persona || spec.personaFallback || "Curious explorer").trim();
                const journey = [];
                journey.push(`Journey map — persona: ${persona}`);
                journey.push("");
                stages.forEach((stage, index) => {
                    journey.push(`${index + 1}. ${stage}`);
                    if (emotions[index]) journey.push(`   • Emotion: ${emotions[index]}`);
                    if (opportunities[index]) journey.push(`   • Opportunity: ${opportunities[index]}`);
                });
                clone.payload = journey.join("
        ");
                clone.vars.lastJourney = { persona, stages, emotions, opportunities };
                clone.logs.push("Generated journey map action block.");
                return [clone];
            }
        },
        {
            id: 'imagination-utility-line-01',
            category: 'utility',
            name: 'Tidy echoes line crafter',
            description: 'Filter and decorate payload lines for ready-to-share snippets.',
            icon: 'align-left',
            accent: '#38bdf8',
            tags: [
                'lines',
                'formatting',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                minLength: 0,
                maxLength: 120,
                prefix: '»',
                suffix: '↗',
                numbering: true,
            },
            form: [
                {
                    key: 'minLength',
                    type: 'number',
                    label: 'Minimum length',
                    default: 0,
                },
                {
                    key: 'maxLength',
                    type: 'number',
                    label: 'Maximum length',
                    default: 120,
                },
                {
                    key: 'prefix',
                    type: 'text',
                    label: 'Prefix',
                    placeholder: '»',
                    default: '»',
                },
                {
                    key: 'suffix',
                    type: 'text',
                    label: 'Suffix',
                    placeholder: '↗',
                    default: '↗',
                },
                {
                    key: 'numbering',
                    type: 'checkbox',
                    label: 'Add numbering',
                    default: true,
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const linesIn = QuickActionTools.toText(clone.payload).split(/        ?
        /);
                const minLength = Number(config?.minLength);
                const maxLength = Number(config?.maxLength);
                const prefix = String(config?.prefix || spec.prefixFallback || "").trim();
                const suffix = String(config?.suffix || spec.suffixFallback || "").trim();
                const numbering = Boolean(config?.numbering);
                const filtered = linesIn.filter(line => {
                    const length = line.trim().length;
                    if (!Number.isNaN(minLength) && length < minLength) return false;
                    if (!Number.isNaN(maxLength) && length > maxLength) return false;
                    return line.trim().length > 0;
                });
                const transformed = filtered.map((line, index) => {
                    const numbered = numbering ? `${index + 1}. ${line.trim()}` : line.trim();
                    const withPrefix = prefix ? `${prefix} ${numbered}` : numbered;
                    return suffix ? `${withPrefix} ${suffix}` : withPrefix;
                });
                clone.payload = transformed.join("
        ");
                clone.vars.lastLineCraft = { count: transformed.length, prefix, suffix, numbering };
                clone.logs.push("Processed payload with line crafter block.");
                return [clone];
            }
        },
        {
            id: 'imagination-utility-line-02',
            category: 'utility',
            name: 'Gentle steps line crafter',
            description: 'Filter and decorate payload lines for ready-to-share snippets.',
            icon: 'align-left',
            accent: '#34d399',
            tags: [
                'lines',
                'formatting',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                minLength: 0,
                maxLength: 120,
                prefix: '∙',
                suffix: '',
                numbering: true,
            },
            form: [
                {
                    key: 'minLength',
                    type: 'number',
                    label: 'Minimum length',
                    default: 0,
                },
                {
                    key: 'maxLength',
                    type: 'number',
                    label: 'Maximum length',
                    default: 120,
                },
                {
                    key: 'prefix',
                    type: 'text',
                    label: 'Prefix',
                    placeholder: '∙',
                    default: '∙',
                },
                {
                    key: 'suffix',
                    type: 'text',
                    label: 'Suffix',
                    placeholder: '',
                    default: '',
                },
                {
                    key: 'numbering',
                    type: 'checkbox',
                    label: 'Add numbering',
                    default: true,
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const linesIn = QuickActionTools.toText(clone.payload).split(/        ?
        /);
                const minLength = Number(config?.minLength);
                const maxLength = Number(config?.maxLength);
                const prefix = String(config?.prefix || spec.prefixFallback || "").trim();
                const suffix = String(config?.suffix || spec.suffixFallback || "").trim();
                const numbering = Boolean(config?.numbering);
                const filtered = linesIn.filter(line => {
                    const length = line.trim().length;
                    if (!Number.isNaN(minLength) && length < minLength) return false;
                    if (!Number.isNaN(maxLength) && length > maxLength) return false;
                    return line.trim().length > 0;
                });
                const transformed = filtered.map((line, index) => {
                    const numbered = numbering ? `${index + 1}. ${line.trim()}` : line.trim();
                    const withPrefix = prefix ? `${prefix} ${numbered}` : numbered;
                    return suffix ? `${withPrefix} ${suffix}` : withPrefix;
                });
                clone.payload = transformed.join("
        ");
                clone.vars.lastLineCraft = { count: transformed.length, prefix, suffix, numbering };
                clone.logs.push("Processed payload with line crafter block.");
                return [clone];
            }
        },
        {
            id: 'imagination-utility-line-03',
            category: 'utility',
            name: 'Brisk rhythm line crafter',
            description: 'Filter and decorate payload lines for ready-to-share snippets.',
            icon: 'align-left',
            accent: '#f97316',
            tags: [
                'lines',
                'formatting',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                minLength: 0,
                maxLength: 120,
                prefix: '•',
                suffix: '— keep moving',
                numbering: true,
            },
            form: [
                {
                    key: 'minLength',
                    type: 'number',
                    label: 'Minimum length',
                    default: 0,
                },
                {
                    key: 'maxLength',
                    type: 'number',
                    label: 'Maximum length',
                    default: 120,
                },
                {
                    key: 'prefix',
                    type: 'text',
                    label: 'Prefix',
                    placeholder: '•',
                    default: '•',
                },
                {
                    key: 'suffix',
                    type: 'text',
                    label: 'Suffix',
                    placeholder: '— keep moving',
                    default: '— keep moving',
                },
                {
                    key: 'numbering',
                    type: 'checkbox',
                    label: 'Add numbering',
                    default: true,
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const linesIn = QuickActionTools.toText(clone.payload).split(/        ?
        /);
                const minLength = Number(config?.minLength);
                const maxLength = Number(config?.maxLength);
                const prefix = String(config?.prefix || spec.prefixFallback || "").trim();
                const suffix = String(config?.suffix || spec.suffixFallback || "").trim();
                const numbering = Boolean(config?.numbering);
                const filtered = linesIn.filter(line => {
                    const length = line.trim().length;
                    if (!Number.isNaN(minLength) && length < minLength) return false;
                    if (!Number.isNaN(maxLength) && length > maxLength) return false;
                    return line.trim().length > 0;
                });
                const transformed = filtered.map((line, index) => {
                    const numbered = numbering ? `${index + 1}. ${line.trim()}` : line.trim();
                    const withPrefix = prefix ? `${prefix} ${numbered}` : numbered;
                    return suffix ? `${withPrefix} ${suffix}` : withPrefix;
                });
                clone.payload = transformed.join("
        ");
                clone.vars.lastLineCraft = { count: transformed.length, prefix, suffix, numbering };
                clone.logs.push("Processed payload with line crafter block.");
                return [clone];
            }
        },
        {
            id: 'imagination-utility-line-04',
            category: 'utility',
            name: 'Quiet notes line crafter',
            description: 'Filter and decorate payload lines for ready-to-share snippets.',
            icon: 'align-left',
            accent: '#a855f7',
            tags: [
                'lines',
                'formatting',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                minLength: 0,
                maxLength: 120,
                prefix: '~',
                suffix: '',
                numbering: true,
            },
            form: [
                {
                    key: 'minLength',
                    type: 'number',
                    label: 'Minimum length',
                    default: 0,
                },
                {
                    key: 'maxLength',
                    type: 'number',
                    label: 'Maximum length',
                    default: 120,
                },
                {
                    key: 'prefix',
                    type: 'text',
                    label: 'Prefix',
                    placeholder: '~',
                    default: '~',
                },
                {
                    key: 'suffix',
                    type: 'text',
                    label: 'Suffix',
                    placeholder: '',
                    default: '',
                },
                {
                    key: 'numbering',
                    type: 'checkbox',
                    label: 'Add numbering',
                    default: true,
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const linesIn = QuickActionTools.toText(clone.payload).split(/        ?
        /);
                const minLength = Number(config?.minLength);
                const maxLength = Number(config?.maxLength);
                const prefix = String(config?.prefix || spec.prefixFallback || "").trim();
                const suffix = String(config?.suffix || spec.suffixFallback || "").trim();
                const numbering = Boolean(config?.numbering);
                const filtered = linesIn.filter(line => {
                    const length = line.trim().length;
                    if (!Number.isNaN(minLength) && length < minLength) return false;
                    if (!Number.isNaN(maxLength) && length > maxLength) return false;
                    return line.trim().length > 0;
                });
                const transformed = filtered.map((line, index) => {
                    const numbered = numbering ? `${index + 1}. ${line.trim()}` : line.trim();
                    const withPrefix = prefix ? `${prefix} ${numbered}` : numbered;
                    return suffix ? `${withPrefix} ${suffix}` : withPrefix;
                });
                clone.payload = transformed.join("
        ");
                clone.vars.lastLineCraft = { count: transformed.length, prefix, suffix, numbering };
                clone.logs.push("Processed payload with line crafter block.");
                return [clone];
            }
        },
        {
            id: 'imagination-utility-line-05',
            category: 'utility',
            name: 'Bold drafts line crafter',
            description: 'Filter and decorate payload lines for ready-to-share snippets.',
            icon: 'align-left',
            accent: '#ef4444',
            tags: [
                'lines',
                'formatting',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                minLength: 0,
                maxLength: 120,
                prefix: '✓',
                suffix: '!',
                numbering: true,
            },
            form: [
                {
                    key: 'minLength',
                    type: 'number',
                    label: 'Minimum length',
                    default: 0,
                },
                {
                    key: 'maxLength',
                    type: 'number',
                    label: 'Maximum length',
                    default: 120,
                },
                {
                    key: 'prefix',
                    type: 'text',
                    label: 'Prefix',
                    placeholder: '✓',
                    default: '✓',
                },
                {
                    key: 'suffix',
                    type: 'text',
                    label: 'Suffix',
                    placeholder: '!',
                    default: '!',
                },
                {
                    key: 'numbering',
                    type: 'checkbox',
                    label: 'Add numbering',
                    default: true,
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const linesIn = QuickActionTools.toText(clone.payload).split(/        ?
        /);
                const minLength = Number(config?.minLength);
                const maxLength = Number(config?.maxLength);
                const prefix = String(config?.prefix || spec.prefixFallback || "").trim();
                const suffix = String(config?.suffix || spec.suffixFallback || "").trim();
                const numbering = Boolean(config?.numbering);
                const filtered = linesIn.filter(line => {
                    const length = line.trim().length;
                    if (!Number.isNaN(minLength) && length < minLength) return false;
                    if (!Number.isNaN(maxLength) && length > maxLength) return false;
                    return line.trim().length > 0;
                });
                const transformed = filtered.map((line, index) => {
                    const numbered = numbering ? `${index + 1}. ${line.trim()}` : line.trim();
                    const withPrefix = prefix ? `${prefix} ${numbered}` : numbered;
                    return suffix ? `${withPrefix} ${suffix}` : withPrefix;
                });
                clone.payload = transformed.join("
        ");
                clone.vars.lastLineCraft = { count: transformed.length, prefix, suffix, numbering };
                clone.logs.push("Processed payload with line crafter block.");
                return [clone];
            }
        },
        {
            id: 'imagination-utility-line-06',
            category: 'utility',
            name: 'Soft lights line crafter',
            description: 'Filter and decorate payload lines for ready-to-share snippets.',
            icon: 'align-left',
            accent: '#60a5fa',
            tags: [
                'lines',
                'formatting',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                minLength: 0,
                maxLength: 120,
                prefix: '→',
                suffix: '',
                numbering: true,
            },
            form: [
                {
                    key: 'minLength',
                    type: 'number',
                    label: 'Minimum length',
                    default: 0,
                },
                {
                    key: 'maxLength',
                    type: 'number',
                    label: 'Maximum length',
                    default: 120,
                },
                {
                    key: 'prefix',
                    type: 'text',
                    label: 'Prefix',
                    placeholder: '→',
                    default: '→',
                },
                {
                    key: 'suffix',
                    type: 'text',
                    label: 'Suffix',
                    placeholder: '',
                    default: '',
                },
                {
                    key: 'numbering',
                    type: 'checkbox',
                    label: 'Add numbering',
                    default: true,
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const linesIn = QuickActionTools.toText(clone.payload).split(/        ?
        /);
                const minLength = Number(config?.minLength);
                const maxLength = Number(config?.maxLength);
                const prefix = String(config?.prefix || spec.prefixFallback || "").trim();
                const suffix = String(config?.suffix || spec.suffixFallback || "").trim();
                const numbering = Boolean(config?.numbering);
                const filtered = linesIn.filter(line => {
                    const length = line.trim().length;
                    if (!Number.isNaN(minLength) && length < minLength) return false;
                    if (!Number.isNaN(maxLength) && length > maxLength) return false;
                    return line.trim().length > 0;
                });
                const transformed = filtered.map((line, index) => {
                    const numbered = numbering ? `${index + 1}. ${line.trim()}` : line.trim();
                    const withPrefix = prefix ? `${prefix} ${numbered}` : numbered;
                    return suffix ? `${withPrefix} ${suffix}` : withPrefix;
                });
                clone.payload = transformed.join("
        ");
                clone.vars.lastLineCraft = { count: transformed.length, prefix, suffix, numbering };
                clone.logs.push("Processed payload with line crafter block.");
                return [clone];
            }
        },
        {
            id: 'imagination-utility-words-01',
            category: 'utility',
            name: 'Spark vocabulary shaper',
            description: 'Transform payload words with case and decoration options.',
            icon: 'type',
            accent: '#f59e0b',
            tags: [
                'words',
                'formatting',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                mode: 'uppercase',
                separator: ', ',
                decorate: '',
            },
            form: [
                {
                    key: 'mode',
                    type: 'select',
                    label: 'Mode',
                    options: [
                        {
                            value: 'uppercase',
                            label: 'Uppercase',
                        },
                        {
                            value: 'lowercase',
                            label: 'Lowercase',
                        },
                        {
                            value: 'title',
                            label: 'Title case',
                        },
                        {
                            value: 'alternating',
                            label: 'Alternating',
                        },
                    ],
                    default: 'uppercase',
                },
                {
                    key: 'separator',
                    type: 'text',
                    label: 'Separator',
                    placeholder: ', ',
                    default: ', ',
                },
                {
                    key: 'decorate',
                    type: 'text',
                    label: 'Decoration wrapper',
                    placeholder: '*',
                    default: '',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const baseText = QuickActionTools.toText(clone.payload);
                const separator = String(config?.separator || spec.separatorFallback || ", ").trim();
                const mode = String(config?.mode || spec.modeFallback || "uppercase").trim();
                const decorate = String(config?.decorate || spec.decorateFallback || "").trim();
                const fallbackWords = [
            'curiosity',
            'kindness',
            'momentum',
            'resonance',
            'clarity',
            'bravery',
            'playfulness',
            'care',
            'focus',
            'wonder',
        ];
                let words = baseText.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
                if (words.length === 0) {
                    words = fallbackWords;
                }
                const shaped = words.map((word, index) => {
                    let transformed = word;
                    switch (mode) {
                        case "lowercase":
                            transformed = word.toLowerCase();
                            break;
                        case "title":
                            transformed = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                            break;
                        case "alternating":
                            transformed = index % 2 === 0 ? word.toUpperCase() : word.toLowerCase();
                            break;
                        case "uppercase":
                        default:
                            transformed = word.toUpperCase();
                            break;
                    }
                    return decorate ? `${decorate}${transformed}${decorate}` : transformed;
                });
                clone.payload = shaped.join(separator);
                clone.vars.lastWordShaper = { mode, separator, decorate, count: shaped.length };
                clone.logs.push("Transformed payload with word shaper block.");
                return [clone];
            }
        },
        {
            id: 'imagination-utility-words-02',
            category: 'utility',
            name: 'Resonant phrase shaper',
            description: 'Transform payload words with case and decoration options.',
            icon: 'type',
            accent: '#10b981',
            tags: [
                'words',
                'formatting',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                mode: 'uppercase',
                separator: ' · ',
                decorate: '',
            },
            form: [
                {
                    key: 'mode',
                    type: 'select',
                    label: 'Mode',
                    options: [
                        {
                            value: 'uppercase',
                            label: 'Uppercase',
                        },
                        {
                            value: 'lowercase',
                            label: 'Lowercase',
                        },
                        {
                            value: 'title',
                            label: 'Title case',
                        },
                        {
                            value: 'alternating',
                            label: 'Alternating',
                        },
                    ],
                    default: 'uppercase',
                },
                {
                    key: 'separator',
                    type: 'text',
                    label: 'Separator',
                    placeholder: ' · ',
                    default: ' · ',
                },
                {
                    key: 'decorate',
                    type: 'text',
                    label: 'Decoration wrapper',
                    placeholder: '*',
                    default: '',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const baseText = QuickActionTools.toText(clone.payload);
                const separator = String(config?.separator || spec.separatorFallback || ", ").trim();
                const mode = String(config?.mode || spec.modeFallback || "uppercase").trim();
                const decorate = String(config?.decorate || spec.decorateFallback || "").trim();
                const fallbackWords = [
            'curiosity',
            'kindness',
            'momentum',
            'resonance',
            'clarity',
            'bravery',
            'playfulness',
            'care',
            'focus',
            'wonder',
        ];
                let words = baseText.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
                if (words.length === 0) {
                    words = fallbackWords;
                }
                const shaped = words.map((word, index) => {
                    let transformed = word;
                    switch (mode) {
                        case "lowercase":
                            transformed = word.toLowerCase();
                            break;
                        case "title":
                            transformed = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                            break;
                        case "alternating":
                            transformed = index % 2 === 0 ? word.toUpperCase() : word.toLowerCase();
                            break;
                        case "uppercase":
                        default:
                            transformed = word.toUpperCase();
                            break;
                    }
                    return decorate ? `${decorate}${transformed}${decorate}` : transformed;
                });
                clone.payload = shaped.join(separator);
                clone.vars.lastWordShaper = { mode, separator, decorate, count: shaped.length };
                clone.logs.push("Transformed payload with word shaper block.");
                return [clone];
            }
        },
        {
            id: 'imagination-utility-words-03',
            category: 'utility',
            name: 'Bold syllable shaper',
            description: 'Transform payload words with case and decoration options.',
            icon: 'type',
            accent: '#f97316',
            tags: [
                'words',
                'formatting',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                mode: 'uppercase',
                separator: ' / ',
                decorate: '',
            },
            form: [
                {
                    key: 'mode',
                    type: 'select',
                    label: 'Mode',
                    options: [
                        {
                            value: 'uppercase',
                            label: 'Uppercase',
                        },
                        {
                            value: 'lowercase',
                            label: 'Lowercase',
                        },
                        {
                            value: 'title',
                            label: 'Title case',
                        },
                        {
                            value: 'alternating',
                            label: 'Alternating',
                        },
                    ],
                    default: 'uppercase',
                },
                {
                    key: 'separator',
                    type: 'text',
                    label: 'Separator',
                    placeholder: ' / ',
                    default: ' / ',
                },
                {
                    key: 'decorate',
                    type: 'text',
                    label: 'Decoration wrapper',
                    placeholder: '*',
                    default: '',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const baseText = QuickActionTools.toText(clone.payload);
                const separator = String(config?.separator || spec.separatorFallback || ", ").trim();
                const mode = String(config?.mode || spec.modeFallback || "uppercase").trim();
                const decorate = String(config?.decorate || spec.decorateFallback || "").trim();
                const fallbackWords = [
            'curiosity',
            'kindness',
            'momentum',
            'resonance',
            'clarity',
            'bravery',
            'playfulness',
            'care',
            'focus',
            'wonder',
        ];
                let words = baseText.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
                if (words.length === 0) {
                    words = fallbackWords;
                }
                const shaped = words.map((word, index) => {
                    let transformed = word;
                    switch (mode) {
                        case "lowercase":
                            transformed = word.toLowerCase();
                            break;
                        case "title":
                            transformed = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                            break;
                        case "alternating":
                            transformed = index % 2 === 0 ? word.toUpperCase() : word.toLowerCase();
                            break;
                        case "uppercase":
                        default:
                            transformed = word.toUpperCase();
                            break;
                    }
                    return decorate ? `${decorate}${transformed}${decorate}` : transformed;
                });
                clone.payload = shaped.join(separator);
                clone.vars.lastWordShaper = { mode, separator, decorate, count: shaped.length };
                clone.logs.push("Transformed payload with word shaper block.");
                return [clone];
            }
        },
        {
            id: 'imagination-utility-words-04',
            category: 'utility',
            name: 'Soft mantra shaper',
            description: 'Transform payload words with case and decoration options.',
            icon: 'type',
            accent: '#a855f7',
            tags: [
                'words',
                'formatting',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                mode: 'uppercase',
                separator: ' | ',
                decorate: '',
            },
            form: [
                {
                    key: 'mode',
                    type: 'select',
                    label: 'Mode',
                    options: [
                        {
                            value: 'uppercase',
                            label: 'Uppercase',
                        },
                        {
                            value: 'lowercase',
                            label: 'Lowercase',
                        },
                        {
                            value: 'title',
                            label: 'Title case',
                        },
                        {
                            value: 'alternating',
                            label: 'Alternating',
                        },
                    ],
                    default: 'uppercase',
                },
                {
                    key: 'separator',
                    type: 'text',
                    label: 'Separator',
                    placeholder: ' | ',
                    default: ' | ',
                },
                {
                    key: 'decorate',
                    type: 'text',
                    label: 'Decoration wrapper',
                    placeholder: '*',
                    default: '',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const baseText = QuickActionTools.toText(clone.payload);
                const separator = String(config?.separator || spec.separatorFallback || ", ").trim();
                const mode = String(config?.mode || spec.modeFallback || "uppercase").trim();
                const decorate = String(config?.decorate || spec.decorateFallback || "").trim();
                const fallbackWords = [
            'curiosity',
            'kindness',
            'momentum',
            'resonance',
            'clarity',
            'bravery',
            'playfulness',
            'care',
            'focus',
            'wonder',
        ];
                let words = baseText.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
                if (words.length === 0) {
                    words = fallbackWords;
                }
                const shaped = words.map((word, index) => {
                    let transformed = word;
                    switch (mode) {
                        case "lowercase":
                            transformed = word.toLowerCase();
                            break;
                        case "title":
                            transformed = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                            break;
                        case "alternating":
                            transformed = index % 2 === 0 ? word.toUpperCase() : word.toLowerCase();
                            break;
                        case "uppercase":
                        default:
                            transformed = word.toUpperCase();
                            break;
                    }
                    return decorate ? `${decorate}${transformed}${decorate}` : transformed;
                });
                clone.payload = shaped.join(separator);
                clone.vars.lastWordShaper = { mode, separator, decorate, count: shaped.length };
                clone.logs.push("Transformed payload with word shaper block.");
                return [clone];
            }
        },
        {
            id: 'imagination-utility-words-05',
            category: 'utility',
            name: 'Clarity bead shaper',
            description: 'Transform payload words with case and decoration options.',
            icon: 'type',
            accent: '#38bdf8',
            tags: [
                'words',
                'formatting',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                mode: 'uppercase',
                separator: ' • ',
                decorate: '',
            },
            form: [
                {
                    key: 'mode',
                    type: 'select',
                    label: 'Mode',
                    options: [
                        {
                            value: 'uppercase',
                            label: 'Uppercase',
                        },
                        {
                            value: 'lowercase',
                            label: 'Lowercase',
                        },
                        {
                            value: 'title',
                            label: 'Title case',
                        },
                        {
                            value: 'alternating',
                            label: 'Alternating',
                        },
                    ],
                    default: 'uppercase',
                },
                {
                    key: 'separator',
                    type: 'text',
                    label: 'Separator',
                    placeholder: ' • ',
                    default: ' • ',
                },
                {
                    key: 'decorate',
                    type: 'text',
                    label: 'Decoration wrapper',
                    placeholder: '*',
                    default: '',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const baseText = QuickActionTools.toText(clone.payload);
                const separator = String(config?.separator || spec.separatorFallback || ", ").trim();
                const mode = String(config?.mode || spec.modeFallback || "uppercase").trim();
                const decorate = String(config?.decorate || spec.decorateFallback || "").trim();
                const fallbackWords = [
            'curiosity',
            'kindness',
            'momentum',
            'resonance',
            'clarity',
            'bravery',
            'playfulness',
            'care',
            'focus',
            'wonder',
        ];
                let words = baseText.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
                if (words.length === 0) {
                    words = fallbackWords;
                }
                const shaped = words.map((word, index) => {
                    let transformed = word;
                    switch (mode) {
                        case "lowercase":
                            transformed = word.toLowerCase();
                            break;
                        case "title":
                            transformed = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                            break;
                        case "alternating":
                            transformed = index % 2 === 0 ? word.toUpperCase() : word.toLowerCase();
                            break;
                        case "uppercase":
                        default:
                            transformed = word.toUpperCase();
                            break;
                    }
                    return decorate ? `${decorate}${transformed}${decorate}` : transformed;
                });
                clone.payload = shaped.join(separator);
                clone.vars.lastWordShaper = { mode, separator, decorate, count: shaped.length };
                clone.logs.push("Transformed payload with word shaper block.");
                return [clone];
            }
        },
        {
            id: 'imagination-utility-words-06',
            category: 'utility',
            name: 'Curiosity string shaper',
            description: 'Transform payload words with case and decoration options.',
            icon: 'type',
            accent: '#c084fc',
            tags: [
                'words',
                'formatting',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                mode: 'uppercase',
                separator: '; ',
                decorate: '',
            },
            form: [
                {
                    key: 'mode',
                    type: 'select',
                    label: 'Mode',
                    options: [
                        {
                            value: 'uppercase',
                            label: 'Uppercase',
                        },
                        {
                            value: 'lowercase',
                            label: 'Lowercase',
                        },
                        {
                            value: 'title',
                            label: 'Title case',
                        },
                        {
                            value: 'alternating',
                            label: 'Alternating',
                        },
                    ],
                    default: 'uppercase',
                },
                {
                    key: 'separator',
                    type: 'text',
                    label: 'Separator',
                    placeholder: '; ',
                    default: '; ',
                },
                {
                    key: 'decorate',
                    type: 'text',
                    label: 'Decoration wrapper',
                    placeholder: '*',
                    default: '',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const baseText = QuickActionTools.toText(clone.payload);
                const separator = String(config?.separator || spec.separatorFallback || ", ").trim();
                const mode = String(config?.mode || spec.modeFallback || "uppercase").trim();
                const decorate = String(config?.decorate || spec.decorateFallback || "").trim();
                const fallbackWords = [
            'curiosity',
            'kindness',
            'momentum',
            'resonance',
            'clarity',
            'bravery',
            'playfulness',
            'care',
            'focus',
            'wonder',
        ];
                let words = baseText.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
                if (words.length === 0) {
                    words = fallbackWords;
                }
                const shaped = words.map((word, index) => {
                    let transformed = word;
                    switch (mode) {
                        case "lowercase":
                            transformed = word.toLowerCase();
                            break;
                        case "title":
                            transformed = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                            break;
                        case "alternating":
                            transformed = index % 2 === 0 ? word.toUpperCase() : word.toLowerCase();
                            break;
                        case "uppercase":
                        default:
                            transformed = word.toUpperCase();
                            break;
                    }
                    return decorate ? `${decorate}${transformed}${decorate}` : transformed;
                });
                clone.payload = shaped.join(separator);
                clone.vars.lastWordShaper = { mode, separator, decorate, count: shaped.length };
                clone.logs.push("Transformed payload with word shaper block.");
                return [clone];
            }
        },
        {
            id: 'imagination-utility-metrics-01',
            category: 'utility',
            name: 'Payload lens metrics',
            description: 'Summarise payload metrics for quick insight and sharing.',
            icon: 'bar-chart-2',
            accent: '#6366f1',
            tags: [
                'analysis',
                'metrics',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {},
            form: [],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const text = QuickActionTools.toText(clone.payload);
                const linesList = text.split(/        ?
        /);
                const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
                const charCount = text.length;
                const longest = linesList.reduce((max, line) => Math.max(max, line.length), 0);
                const shortest = linesList.filter(line => line.trim().length > 0).reduce((min, line) => Math.min(min, line.length), text.length || 0);
                const metrics = [];
                metrics.push("Payload metrics");
                metrics.push("");
                metrics.push(`Lines: ${linesList.length}`);
                metrics.push(`Words: ${wordCount}`);
                metrics.push(`Characters: ${charCount}`);
                metrics.push(`Longest line: ${longest}`);
                metrics.push(`Shortest line: ${shortest === text.length ? 0 : shortest}`);
                const sample = linesList.slice(0, 5).map(line => line.trim()).filter(Boolean);
                if (sample.length > 0) {
                    metrics.push("");
                    metrics.push("Sample:");
                    sample.forEach(line => metrics.push(`  • ${line}`));
                }
                clone.payload = metrics.join("
        ");
                clone.vars.lastMetrics = { lines: linesList.length, wordCount, charCount, longest, shortest: shortest === text.length ? 0 : shortest };
                clone.logs.push("Generated payload metrics block.");
                return [clone];
            }
        },
        {
            id: 'imagination-utility-metrics-02',
            category: 'utility',
            name: 'Snapshot insight metrics',
            description: 'Summarise payload metrics for quick insight and sharing.',
            icon: 'bar-chart-2',
            accent: '#f43f5e',
            tags: [
                'analysis',
                'metrics',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {},
            form: [],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const text = QuickActionTools.toText(clone.payload);
                const linesList = text.split(/        ?
        /);
                const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
                const charCount = text.length;
                const longest = linesList.reduce((max, line) => Math.max(max, line.length), 0);
                const shortest = linesList.filter(line => line.trim().length > 0).reduce((min, line) => Math.min(min, line.length), text.length || 0);
                const metrics = [];
                metrics.push("Payload metrics");
                metrics.push("");
                metrics.push(`Lines: ${linesList.length}`);
                metrics.push(`Words: ${wordCount}`);
                metrics.push(`Characters: ${charCount}`);
                metrics.push(`Longest line: ${longest}`);
                metrics.push(`Shortest line: ${shortest === text.length ? 0 : shortest}`);
                const sample = linesList.slice(0, 5).map(line => line.trim()).filter(Boolean);
                if (sample.length > 0) {
                    metrics.push("");
                    metrics.push("Sample:");
                    sample.forEach(line => metrics.push(`  • ${line}`));
                }
                clone.payload = metrics.join("
        ");
                clone.vars.lastMetrics = { lines: linesList.length, wordCount, charCount, longest, shortest: shortest === text.length ? 0 : shortest };
                clone.logs.push("Generated payload metrics block.");
                return [clone];
            }
        },
        {
            id: 'imagination-utility-metrics-03',
            category: 'utility',
            name: 'Clarity diagnostics metrics',
            description: 'Summarise payload metrics for quick insight and sharing.',
            icon: 'bar-chart-2',
            accent: '#22d3ee',
            tags: [
                'analysis',
                'metrics',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {},
            form: [],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const text = QuickActionTools.toText(clone.payload);
                const linesList = text.split(/        ?
        /);
                const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
                const charCount = text.length;
                const longest = linesList.reduce((max, line) => Math.max(max, line.length), 0);
                const shortest = linesList.filter(line => line.trim().length > 0).reduce((min, line) => Math.min(min, line.length), text.length || 0);
                const metrics = [];
                metrics.push("Payload metrics");
                metrics.push("");
                metrics.push(`Lines: ${linesList.length}`);
                metrics.push(`Words: ${wordCount}`);
                metrics.push(`Characters: ${charCount}`);
                metrics.push(`Longest line: ${longest}`);
                metrics.push(`Shortest line: ${shortest === text.length ? 0 : shortest}`);
                const sample = linesList.slice(0, 5).map(line => line.trim()).filter(Boolean);
                if (sample.length > 0) {
                    metrics.push("");
                    metrics.push("Sample:");
                    sample.forEach(line => metrics.push(`  • ${line}`));
                }
                clone.payload = metrics.join("
        ");
                clone.vars.lastMetrics = { lines: linesList.length, wordCount, charCount, longest, shortest: shortest === text.length ? 0 : shortest };
                clone.logs.push("Generated payload metrics block.");
                return [clone];
            }
        },
        {
            id: 'imagination-utility-weaver-01',
            category: 'utility',
            name: 'Payload bouquet weaver',
            description: 'Combine list entries with the payload using creative templates.',
            icon: 'link',
            accent: '#f472b6',
            tags: [
                'merge',
                'creative',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                listEntries: '',
                template: '🌸 {{entry}} — tied to {{payload}}',
            },
            form: [
                {
                    key: 'listEntries',
                    type: 'textarea',
                    rows: 5,
                    label: 'Entries',
                    placeholder: 'first spark\\nsecond path\\nthird ally',
                    default: '',
                },
                {
                    key: 'template',
                    type: 'text',
                    label: 'Template',
                    placeholder: '🌸 {{entry}} — tied to {{payload}}',
                    default: '🌸 {{entry}} — tied to {{payload}}',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const listLines = String(config?.listEntries || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackEntries = [
            'First thread',
            'Second thread',
            'Third thread',
            'Fourth thread',
        ];
                const entries = listLines.length > 0 ? listLines : fallbackEntries;
                const template = String(config?.template || spec.templateFallback || "{{entry}} — linked to payload").trim();
                const payloadText = QuickActionTools.toText(clone.payload);
                const weaved = entries.map((entry, index) => {
                    const tokenised = template.replace(/{{entry}}/g, entry).replace(/{{index}}/g, String(index + 1));
                    return tokenised.replace(/{{payload}}/g, payloadText);
                });
                clone.payload = weaved.join("
        ");
                clone.vars.lastWeave = { entries, template };
                clone.logs.push("Generated payload weaver block.");
                return [clone];
            }
        },
        {
            id: 'imagination-utility-weaver-02',
            category: 'utility',
            name: 'Echo trail weaver',
            description: 'Combine list entries with the payload using creative templates.',
            icon: 'link',
            accent: '#22c55e',
            tags: [
                'merge',
                'creative',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                listEntries: '',
                template: 'Echo {{index}}: {{entry}} / reflection -> {{payload}}',
            },
            form: [
                {
                    key: 'listEntries',
                    type: 'textarea',
                    rows: 5,
                    label: 'Entries',
                    placeholder: 'first spark\\nsecond path\\nthird ally',
                    default: '',
                },
                {
                    key: 'template',
                    type: 'text',
                    label: 'Template',
                    placeholder: 'Echo {{index}}: {{entry}} / reflection -> {{payload}}',
                    default: 'Echo {{index}}: {{entry}} / reflection -> {{payload}}',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const listLines = String(config?.listEntries || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackEntries = [
            'First thread',
            'Second thread',
            'Third thread',
            'Fourth thread',
        ];
                const entries = listLines.length > 0 ? listLines : fallbackEntries;
                const template = String(config?.template || spec.templateFallback || "{{entry}} — linked to payload").trim();
                const payloadText = QuickActionTools.toText(clone.payload);
                const weaved = entries.map((entry, index) => {
                    const tokenised = template.replace(/{{entry}}/g, entry).replace(/{{index}}/g, String(index + 1));
                    return tokenised.replace(/{{payload}}/g, payloadText);
                });
                clone.payload = weaved.join("
        ");
                clone.vars.lastWeave = { entries, template };
                clone.logs.push("Generated payload weaver block.");
                return [clone];
            }
        },
        {
            id: 'imagination-utility-weaver-03',
            category: 'utility',
            name: 'Compass thread weaver',
            description: 'Combine list entries with the payload using creative templates.',
            icon: 'link',
            accent: '#facc15',
            tags: [
                'merge',
                'creative',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                listEntries: '',
                template: '{{index}}) {{entry}} → anchor with {{payload}}',
            },
            form: [
                {
                    key: 'listEntries',
                    type: 'textarea',
                    rows: 5,
                    label: 'Entries',
                    placeholder: 'first spark\\nsecond path\\nthird ally',
                    default: '',
                },
                {
                    key: 'template',
                    type: 'text',
                    label: 'Template',
                    placeholder: '{{index}}) {{entry}} → anchor with {{payload}}',
                    default: '{{index}}) {{entry}} → anchor with {{payload}}',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const listLines = String(config?.listEntries || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackEntries = [
            'First thread',
            'Second thread',
            'Third thread',
            'Fourth thread',
        ];
                const entries = listLines.length > 0 ? listLines : fallbackEntries;
                const template = String(config?.template || spec.templateFallback || "{{entry}} — linked to payload").trim();
                const payloadText = QuickActionTools.toText(clone.payload);
                const weaved = entries.map((entry, index) => {
                    const tokenised = template.replace(/{{entry}}/g, entry).replace(/{{index}}/g, String(index + 1));
                    return tokenised.replace(/{{payload}}/g, payloadText);
                });
                clone.payload = weaved.join("
        ");
                clone.vars.lastWeave = { entries, template };
                clone.logs.push("Generated payload weaver block.");
                return [clone];
            }
        },
        {
            id: 'imagination-utility-weaver-04',
            category: 'utility',
            name: 'Gratitude link weaver',
            description: 'Combine list entries with the payload using creative templates.',
            icon: 'link',
            accent: '#fb7185',
            tags: [
                'merge',
                'creative',
            ],
            inputs: [
                {
                    id: 'input',
                    label: 'Input',
                },
            ],
            outputs: [
                {
                    id: 'next',
                    label: 'Next',
                },
            ],
            defaultConfig: {
                listEntries: '',
                template: '{{entry}} — appreciation amplified by {{payload}}',
            },
            form: [
                {
                    key: 'listEntries',
                    type: 'textarea',
                    rows: 5,
                    label: 'Entries',
                    placeholder: 'first spark\\nsecond path\\nthird ally',
                    default: '',
                },
                {
                    key: 'template',
                    type: 'text',
                    label: 'Template',
                    placeholder: '{{entry}} — appreciation amplified by {{payload}}',
                    default: '{{entry}} — appreciation amplified by {{payload}}',
                },
            ],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                const listLines = String(config?.listEntries || "").split(/\r?\n/).map(item => String(item || "").trim()).filter(item => item.length > 0);
                const fallbackEntries = [
            'First thread',
            'Second thread',
            'Third thread',
            'Fourth thread',
        ];
                const entries = listLines.length > 0 ? listLines : fallbackEntries;
                const template = String(config?.template || spec.templateFallback || "{{entry}} — linked to payload").trim();
                const payloadText = QuickActionTools.toText(clone.payload);
                const weaved = entries.map((entry, index) => {
                    const tokenised = template.replace(/{{entry}}/g, entry).replace(/{{index}}/g, String(index + 1));
                    return tokenised.replace(/{{payload}}/g, payloadText);
                });
                clone.payload = weaved.join("
        ");
                clone.vars.lastWeave = { entries, template };
                clone.logs.push("Generated payload weaver block.");
                return [clone];
            }
        }
    ];

    return QuickActionImaginationModules;
}

module.exports = createQuickActionImaginationModules;
