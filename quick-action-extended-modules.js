'use strict';

const ExtendedBlockSpecs = [
    {
        id: 'extended-trigger-daily-planner',
        category: 'trigger',
        name: 'Daily planner blueprint',
        description: 'Craft a flowing day with focus anchors, energising rituals, and meaningful reflections.',
        icon: 'sunrise',
        accent: '#f59e0b',
        tags: [
        'template',
        'planning',
        'focus',
        'trigger'
],
        mode: 'template',
        topic: 'the day',
        tones: [
        'energised',
        'balanced',
        'reflective',
        'playful',
        'steady'
],
        sections: [
        {
            title: 'Morning focus ignition',
            theme: 'focus',
            prompts: [
        'Describe how focus shows up for the day today.',
        'List the voices who can elevate focus right now.',
        'Capture one bold experiment connected to focus.',
        'Note signals that confirm focus is thriving.',
        'Document risks that could erode focus if ignored.',
        'Imagine how focus feels when everything clicks.',
        'Outline partnerships that reinforce focus.',
        'Surface questions still open about focus.',
        'Highlight a customer story that embodies focus.',
        'Define a tiny action that nourishes focus today.',
        'Express gratitude related to focus moments.',
        'Sketch the momentum curve of focus across the week.'
],
            ideas: [
        'We could celebrate focus by amplifying clarity.',
        'Invite relationship to co-create focus signals.',
        'Prototype a habit that keeps focus visible.',
        'Audit the workflows touching focus moments.',
        'Pair up with relationship to unstick focus blockers.',
        'Share a win around focus with the wider team.',
        'Capture metrics that relate to focus in the dashboard.',
        'Host a five-minute retro on focus mid-week.',
        'Create an inspirational mood board for focus.',
        'Curate a playlist that mirrors the energy of focus.',
        'Draft a short story describing focus success.',
        'Identify one constraint to relax around focus.'
],
            checkpoints: [
        'Confidence in focus today',
        'Support requested for focus',
        'Signals to monitor for focus',
        'Decision pending around focus',
        'Celebration planned for focus',
        'Learning captured about focus',
        'Risk mitigation for focus',
        'Data sources verifying focus',
        'Stakeholders cheering focus',
        'Timeline adjustments affecting focus',
        'Resources to unlock focus',
        'Experiments for focus next'
]
        },
        {
            title: 'Momentum rituals',
            theme: 'momentum',
            prompts: [
        'Describe how momentum shows up for the day today.',
        'List the voices who can elevate momentum right now.',
        'Capture one bold experiment connected to momentum.',
        'Note signals that confirm momentum is thriving.',
        'Document risks that could erode momentum if ignored.',
        'Imagine how momentum feels when everything clicks.',
        'Outline partnerships that reinforce momentum.',
        'Surface questions still open about momentum.',
        'Highlight a customer story that embodies momentum.',
        'Define a tiny action that nourishes momentum today.',
        'Express gratitude related to momentum moments.',
        'Sketch the momentum curve of momentum across the week.'
],
            ideas: [
        'We could celebrate momentum by amplifying relationship.',
        'Invite energy to co-create momentum signals.',
        'Prototype a habit that keeps momentum visible.',
        'Audit the workflows touching momentum moments.',
        'Pair up with energy to unstick momentum blockers.',
        'Share a win around momentum with the wider team.',
        'Capture metrics that relate to momentum in the dashboard.',
        'Host a five-minute retro on momentum mid-week.',
        'Create an inspirational mood board for momentum.',
        'Curate a playlist that mirrors the energy of momentum.',
        'Draft a short story describing momentum success.',
        'Identify one constraint to relax around momentum.'
],
            checkpoints: [
        'Confidence in momentum today',
        'Support requested for momentum',
        'Signals to monitor for momentum',
        'Decision pending around momentum',
        'Celebration planned for momentum',
        'Learning captured about momentum',
        'Risk mitigation for momentum',
        'Data sources verifying momentum',
        'Stakeholders cheering momentum',
        'Timeline adjustments affecting momentum',
        'Resources to unlock momentum',
        'Experiments for momentum next'
]
        },
        {
            title: 'High-impact commitments',
            theme: 'clarity',
            prompts: [
        'Describe how clarity shows up for the day today.',
        'List the voices who can elevate clarity right now.',
        'Capture one bold experiment connected to clarity.',
        'Note signals that confirm clarity is thriving.',
        'Document risks that could erode clarity if ignored.',
        'Imagine how clarity feels when everything clicks.',
        'Outline partnerships that reinforce clarity.',
        'Surface questions still open about clarity.',
        'Highlight a customer story that embodies clarity.',
        'Define a tiny action that nourishes clarity today.',
        'Express gratitude related to clarity moments.',
        'Sketch the momentum curve of clarity across the week.'
],
            ideas: [
        'We could celebrate clarity by amplifying energy.',
        'Invite gratitude to co-create clarity signals.',
        'Prototype a habit that keeps clarity visible.',
        'Audit the workflows touching clarity moments.',
        'Pair up with gratitude to unstick clarity blockers.',
        'Share a win around clarity with the wider team.',
        'Capture metrics that relate to clarity in the dashboard.',
        'Host a five-minute retro on clarity mid-week.',
        'Create an inspirational mood board for clarity.',
        'Curate a playlist that mirrors the energy of clarity.',
        'Draft a short story describing clarity success.',
        'Identify one constraint to relax around clarity.'
],
            checkpoints: [
        'Confidence in clarity today',
        'Support requested for clarity',
        'Signals to monitor for clarity',
        'Decision pending around clarity',
        'Celebration planned for clarity',
        'Learning captured about clarity',
        'Risk mitigation for clarity',
        'Data sources verifying clarity',
        'Stakeholders cheering clarity',
        'Timeline adjustments affecting clarity',
        'Resources to unlock clarity',
        'Experiments for clarity next'
]
        },
        {
            title: 'Collaboration sync',
            theme: 'relationship',
            prompts: [
        'Describe how relationship shows up for the day today.',
        'List the voices who can elevate relationship right now.',
        'Capture one bold experiment connected to relationship.',
        'Note signals that confirm relationship is thriving.',
        'Document risks that could erode relationship if ignored.',
        'Imagine how relationship feels when everything clicks.',
        'Outline partnerships that reinforce relationship.',
        'Surface questions still open about relationship.',
        'Highlight a customer story that embodies relationship.',
        'Define a tiny action that nourishes relationship today.',
        'Express gratitude related to relationship moments.',
        'Sketch the momentum curve of relationship across the week.'
],
            ideas: [
        'We could celebrate relationship by amplifying gratitude.',
        'Invite learning to co-create relationship signals.',
        'Prototype a habit that keeps relationship visible.',
        'Audit the workflows touching relationship moments.',
        'Pair up with learning to unstick relationship blockers.',
        'Share a win around relationship with the wider team.',
        'Capture metrics that relate to relationship in the dashboard.',
        'Host a five-minute retro on relationship mid-week.',
        'Create an inspirational mood board for relationship.',
        'Curate a playlist that mirrors the energy of relationship.',
        'Draft a short story describing relationship success.',
        'Identify one constraint to relax around relationship.'
],
            checkpoints: [
        'Confidence in relationship today',
        'Support requested for relationship',
        'Signals to monitor for relationship',
        'Decision pending around relationship',
        'Celebration planned for relationship',
        'Learning captured about relationship',
        'Risk mitigation for relationship',
        'Data sources verifying relationship',
        'Stakeholders cheering relationship',
        'Timeline adjustments affecting relationship',
        'Resources to unlock relationship',
        'Experiments for relationship next'
]
        },
        {
            title: 'Energy break ideas',
            theme: 'energy',
            prompts: [
        'Describe how energy shows up for the day today.',
        'List the voices who can elevate energy right now.',
        'Capture one bold experiment connected to energy.',
        'Note signals that confirm energy is thriving.',
        'Document risks that could erode energy if ignored.',
        'Imagine how energy feels when everything clicks.',
        'Outline partnerships that reinforce energy.',
        'Surface questions still open about energy.',
        'Highlight a customer story that embodies energy.',
        'Define a tiny action that nourishes energy today.',
        'Express gratitude related to energy moments.',
        'Sketch the momentum curve of energy across the week.'
],
            ideas: [
        'We could celebrate energy by amplifying learning.',
        'Invite rhythm to co-create energy signals.',
        'Prototype a habit that keeps energy visible.',
        'Audit the workflows touching energy moments.',
        'Pair up with rhythm to unstick energy blockers.',
        'Share a win around energy with the wider team.',
        'Capture metrics that relate to energy in the dashboard.',
        'Host a five-minute retro on energy mid-week.',
        'Create an inspirational mood board for energy.',
        'Curate a playlist that mirrors the energy of energy.',
        'Draft a short story describing energy success.',
        'Identify one constraint to relax around energy.'
],
            checkpoints: [
        'Confidence in energy today',
        'Support requested for energy',
        'Signals to monitor for energy',
        'Decision pending around energy',
        'Celebration planned for energy',
        'Learning captured about energy',
        'Risk mitigation for energy',
        'Data sources verifying energy',
        'Stakeholders cheering energy',
        'Timeline adjustments affecting energy',
        'Resources to unlock energy',
        'Experiments for energy next'
]
        },
        {
            title: 'Evening reset',
            theme: 'gratitude',
            prompts: [
        'Describe how gratitude shows up for the day today.',
        'List the voices who can elevate gratitude right now.',
        'Capture one bold experiment connected to gratitude.',
        'Note signals that confirm gratitude is thriving.',
        'Document risks that could erode gratitude if ignored.',
        'Imagine how gratitude feels when everything clicks.',
        'Outline partnerships that reinforce gratitude.',
        'Surface questions still open about gratitude.',
        'Highlight a customer story that embodies gratitude.',
        'Define a tiny action that nourishes gratitude today.',
        'Express gratitude related to gratitude moments.',
        'Sketch the momentum curve of gratitude across the week.'
],
            ideas: [
        'We could celebrate gratitude by amplifying rhythm.',
        'Invite focus to co-create gratitude signals.',
        'Prototype a habit that keeps gratitude visible.',
        'Audit the workflows touching gratitude moments.',
        'Pair up with focus to unstick gratitude blockers.',
        'Share a win around gratitude with the wider team.',
        'Capture metrics that relate to gratitude in the dashboard.',
        'Host a five-minute retro on gratitude mid-week.',
        'Create an inspirational mood board for gratitude.',
        'Curate a playlist that mirrors the energy of gratitude.',
        'Draft a short story describing gratitude success.',
        'Identify one constraint to relax around gratitude.'
],
            checkpoints: [
        'Confidence in gratitude today',
        'Support requested for gratitude',
        'Signals to monitor for gratitude',
        'Decision pending around gratitude',
        'Celebration planned for gratitude',
        'Learning captured about gratitude',
        'Risk mitigation for gratitude',
        'Data sources verifying gratitude',
        'Stakeholders cheering gratitude',
        'Timeline adjustments affecting gratitude',
        'Resources to unlock gratitude',
        'Experiments for gratitude next'
]
        },
        {
            title: 'Gratitude sparks',
            theme: 'learning',
            prompts: [
        'Describe how learning shows up for the day today.',
        'List the voices who can elevate learning right now.',
        'Capture one bold experiment connected to learning.',
        'Note signals that confirm learning is thriving.',
        'Document risks that could erode learning if ignored.',
        'Imagine how learning feels when everything clicks.',
        'Outline partnerships that reinforce learning.',
        'Surface questions still open about learning.',
        'Highlight a customer story that embodies learning.',
        'Define a tiny action that nourishes learning today.',
        'Express gratitude related to learning moments.',
        'Sketch the momentum curve of learning across the week.'
],
            ideas: [
        'We could celebrate learning by amplifying focus.',
        'Invite momentum to co-create learning signals.',
        'Prototype a habit that keeps learning visible.',
        'Audit the workflows touching learning moments.',
        'Pair up with momentum to unstick learning blockers.',
        'Share a win around learning with the wider team.',
        'Capture metrics that relate to learning in the dashboard.',
        'Host a five-minute retro on learning mid-week.',
        'Create an inspirational mood board for learning.',
        'Curate a playlist that mirrors the energy of learning.',
        'Draft a short story describing learning success.',
        'Identify one constraint to relax around learning.'
],
            checkpoints: [
        'Confidence in learning today',
        'Support requested for learning',
        'Signals to monitor for learning',
        'Decision pending around learning',
        'Celebration planned for learning',
        'Learning captured about learning',
        'Risk mitigation for learning',
        'Data sources verifying learning',
        'Stakeholders cheering learning',
        'Timeline adjustments affecting learning',
        'Resources to unlock learning',
        'Experiments for learning next'
]
        },
        {
            title: 'Tomorrow\'s preview',
            theme: 'rhythm',
            prompts: [
        'Describe how rhythm shows up for the day today.',
        'List the voices who can elevate rhythm right now.',
        'Capture one bold experiment connected to rhythm.',
        'Note signals that confirm rhythm is thriving.',
        'Document risks that could erode rhythm if ignored.',
        'Imagine how rhythm feels when everything clicks.',
        'Outline partnerships that reinforce rhythm.',
        'Surface questions still open about rhythm.',
        'Highlight a customer story that embodies rhythm.',
        'Define a tiny action that nourishes rhythm today.',
        'Express gratitude related to rhythm moments.',
        'Sketch the momentum curve of rhythm across the week.'
],
            ideas: [
        'We could celebrate rhythm by amplifying momentum.',
        'Invite clarity to co-create rhythm signals.',
        'Prototype a habit that keeps rhythm visible.',
        'Audit the workflows touching rhythm moments.',
        'Pair up with clarity to unstick rhythm blockers.',
        'Share a win around rhythm with the wider team.',
        'Capture metrics that relate to rhythm in the dashboard.',
        'Host a five-minute retro on rhythm mid-week.',
        'Create an inspirational mood board for rhythm.',
        'Curate a playlist that mirrors the energy of rhythm.',
        'Draft a short story describing rhythm success.',
        'Identify one constraint to relax around rhythm.'
],
            checkpoints: [
        'Confidence in rhythm today',
        'Support requested for rhythm',
        'Signals to monitor for rhythm',
        'Decision pending around rhythm',
        'Celebration planned for rhythm',
        'Learning captured about rhythm',
        'Risk mitigation for rhythm',
        'Data sources verifying rhythm',
        'Stakeholders cheering rhythm',
        'Timeline adjustments affecting rhythm',
        'Resources to unlock rhythm',
        'Experiments for rhythm next'
]
        }
],
        affirmations: [
        'We protect momentum even when things wobble.',
        'Curiosity fuels every iteration we attempt.',
        'We celebrate micro-wins loudly and often.',
        'Humans first, then process, then tooling.',
        'We learn faster together than alone.',
        'Every obstacle carries a hidden insight.',
        'Joy and rigor can absolutely coexist.',
        'We narrate progress so others feel invited.',
        'Pauses are an intentional productivity move.',
        'We choose clarity over speed when needed.',
        'Listening deeply is our superpower.',
        'We prioritise kindness without losing edge.',
        'Celebration is a strategy, not an afterthought.',
        'Asking better questions unlocks better answers.',
        'We leave room for surprise and delight.',
        'Tiny experiments accumulate into bold impact.',
        'Documenting context keeps the future grateful.',
        'We signal progress with warmth and precision.',
        'Reflection is the bridge between today and tomorrow.',
        'We craft experiences that feel like a conversation.',
        'We choose focus storyline',
        'We choose focus highlight',
        'We choose focus question',
        'We choose focus invitation',
        'We choose focus experiment',
        'We choose momentum storyline',
        'We choose momentum highlight',
        'We choose momentum question',
        'We choose momentum invitation',
        'We choose momentum experiment',
        'We choose clarity storyline',
        'We choose clarity highlight',
        'We choose clarity question',
        'We choose clarity invitation',
        'We choose clarity experiment',
        'We choose relationship storyline',
        'We choose relationship highlight',
        'We choose relationship question',
        'We choose relationship invitation',
        'We choose relationship experiment',
        'We choose energy storyline',
        'We choose energy highlight',
        'We choose energy question',
        'We choose energy invitation',
        'We choose energy experiment',
        'We choose gratitude storyline',
        'We choose gratitude highlight',
        'We choose gratitude question',
        'We choose gratitude invitation',
        'We choose gratitude experiment',
        'We choose learning storyline',
        'We choose learning highlight',
        'We choose learning question',
        'We choose learning invitation',
        'We choose learning experiment',
        'We choose rhythm storyline',
        'We choose rhythm highlight',
        'We choose rhythm question',
        'We choose rhythm invitation',
        'We choose rhythm experiment'
],
        defaultConfig: {
    title: 'Daily planner blueprint',
    tone: 'energised',
    sections: 'Morning focus ignition,Momentum rituals,High-impact commitments,Collaboration sync',
    includeReflection: true,
    customHighlights: ''
},
        form: [
        {
            key: 'title',
            label: 'Template title',
            type: 'text',
            placeholder: 'Daily planner blueprint'
        },
        {
            key: 'tone',
            label: 'Tone',
            type: 'select',
            options: [
        {
            value: 'energised',
            label: 'Energised'
        },
        {
            value: 'balanced',
            label: 'Balanced'
        },
        {
            value: 'reflective',
            label: 'Reflective'
        },
        {
            value: 'playful',
            label: 'Playful'
        },
        {
            value: 'steady',
            label: 'Steady'
        }
]
        },
        {
            key: 'sections',
            label: 'Sections to include',
            type: 'textarea',
            rows: 3,
            placeholder: 'Morning focus ignition,Momentum rituals,High-impact commitments,Collaboration sync'
        },
        {
            key: 'includeReflection',
            label: 'Add reflection prompts',
            type: 'checkbox'
        },
        {
            key: 'customHighlights',
            label: 'Custom highlights',
            type: 'textarea',
            rows: 3,
            placeholder: 'Wins to celebrate'
        }
]
    },
    {
        id: 'extended-trigger-weekly-retro',
        category: 'trigger',
        name: 'Weekly retrospective navigator',
        description: 'Guide a thoughtful retrospective with wins, lessons, and forward experiments.',
        icon: 'rotate-ccw',
        accent: '#a855f7',
        tags: [
        'template',
        'team',
        'insight',
        'trigger'
],
        mode: 'template',
        topic: 'this week',
        tones: [
        'curious',
        'grounded',
        'optimistic',
        'candid',
        'celebratory'
],
        sections: [
        {
            title: 'Celebrations',
            theme: 'achievement',
            prompts: [
        'Describe how achievement shows up for this week today.',
        'List the voices who can elevate achievement right now.',
        'Capture one bold experiment connected to achievement.',
        'Note signals that confirm achievement is thriving.',
        'Document risks that could erode achievement if ignored.',
        'Imagine how achievement feels when everything clicks.',
        'Outline partnerships that reinforce achievement.',
        'Surface questions still open about achievement.',
        'Highlight a customer story that embodies achievement.',
        'Define a tiny action that nourishes achievement today.',
        'Express gratitude related to achievement moments.',
        'Sketch the momentum curve of achievement across the week.'
],
            ideas: [
        'We could celebrate achievement by amplifying challenge.',
        'Invite data to co-create achievement signals.',
        'Prototype a habit that keeps achievement visible.',
        'Audit the workflows touching achievement moments.',
        'Pair up with data to unstick achievement blockers.',
        'Share a win around achievement with the wider team.',
        'Capture metrics that relate to achievement in the dashboard.',
        'Host a five-minute retro on achievement mid-week.',
        'Create an inspirational mood board for achievement.',
        'Curate a playlist that mirrors the energy of achievement.',
        'Draft a short story describing achievement success.',
        'Identify one constraint to relax around achievement.'
],
            checkpoints: [
        'Confidence in achievement today',
        'Support requested for achievement',
        'Signals to monitor for achievement',
        'Decision pending around achievement',
        'Celebration planned for achievement',
        'Learning captured about achievement',
        'Risk mitigation for achievement',
        'Data sources verifying achievement',
        'Stakeholders cheering achievement',
        'Timeline adjustments affecting achievement',
        'Resources to unlock achievement',
        'Experiments for achievement next'
]
        },
        {
            title: 'Surprises',
            theme: 'discovery',
            prompts: [
        'Describe how discovery shows up for this week today.',
        'List the voices who can elevate discovery right now.',
        'Capture one bold experiment connected to discovery.',
        'Note signals that confirm discovery is thriving.',
        'Document risks that could erode discovery if ignored.',
        'Imagine how discovery feels when everything clicks.',
        'Outline partnerships that reinforce discovery.',
        'Surface questions still open about discovery.',
        'Highlight a customer story that embodies discovery.',
        'Define a tiny action that nourishes discovery today.',
        'Express gratitude related to discovery moments.',
        'Sketch the momentum curve of discovery across the week.'
],
            ideas: [
        'We could celebrate discovery by amplifying data.',
        'Invite experiment to co-create discovery signals.',
        'Prototype a habit that keeps discovery visible.',
        'Audit the workflows touching discovery moments.',
        'Pair up with experiment to unstick discovery blockers.',
        'Share a win around discovery with the wider team.',
        'Capture metrics that relate to discovery in the dashboard.',
        'Host a five-minute retro on discovery mid-week.',
        'Create an inspirational mood board for discovery.',
        'Curate a playlist that mirrors the energy of discovery.',
        'Draft a short story describing discovery success.',
        'Identify one constraint to relax around discovery.'
],
            checkpoints: [
        'Confidence in discovery today',
        'Support requested for discovery',
        'Signals to monitor for discovery',
        'Decision pending around discovery',
        'Celebration planned for discovery',
        'Learning captured about discovery',
        'Risk mitigation for discovery',
        'Data sources verifying discovery',
        'Stakeholders cheering discovery',
        'Timeline adjustments affecting discovery',
        'Resources to unlock discovery',
        'Experiments for discovery next'
]
        },
        {
            title: 'Stumbles',
            theme: 'challenge',
            prompts: [
        'Describe how challenge shows up for this week today.',
        'List the voices who can elevate challenge right now.',
        'Capture one bold experiment connected to challenge.',
        'Note signals that confirm challenge is thriving.',
        'Document risks that could erode challenge if ignored.',
        'Imagine how challenge feels when everything clicks.',
        'Outline partnerships that reinforce challenge.',
        'Surface questions still open about challenge.',
        'Highlight a customer story that embodies challenge.',
        'Define a tiny action that nourishes challenge today.',
        'Express gratitude related to challenge moments.',
        'Sketch the momentum curve of challenge across the week.'
],
            ideas: [
        'We could celebrate challenge by amplifying experiment.',
        'Invite gratitude to co-create challenge signals.',
        'Prototype a habit that keeps challenge visible.',
        'Audit the workflows touching challenge moments.',
        'Pair up with gratitude to unstick challenge blockers.',
        'Share a win around challenge with the wider team.',
        'Capture metrics that relate to challenge in the dashboard.',
        'Host a five-minute retro on challenge mid-week.',
        'Create an inspirational mood board for challenge.',
        'Curate a playlist that mirrors the energy of challenge.',
        'Draft a short story describing challenge success.',
        'Identify one constraint to relax around challenge.'
],
            checkpoints: [
        'Confidence in challenge today',
        'Support requested for challenge',
        'Signals to monitor for challenge',
        'Decision pending around challenge',
        'Celebration planned for challenge',
        'Learning captured about challenge',
        'Risk mitigation for challenge',
        'Data sources verifying challenge',
        'Stakeholders cheering challenge',
        'Timeline adjustments affecting challenge',
        'Resources to unlock challenge',
        'Experiments for challenge next'
]
        },
        {
            title: 'Signals',
            theme: 'data',
            prompts: [
        'Describe how data shows up for this week today.',
        'List the voices who can elevate data right now.',
        'Capture one bold experiment connected to data.',
        'Note signals that confirm data is thriving.',
        'Document risks that could erode data if ignored.',
        'Imagine how data feels when everything clicks.',
        'Outline partnerships that reinforce data.',
        'Surface questions still open about data.',
        'Highlight a customer story that embodies data.',
        'Define a tiny action that nourishes data today.',
        'Express gratitude related to data moments.',
        'Sketch the momentum curve of data across the week.'
],
            ideas: [
        'We could celebrate data by amplifying gratitude.',
        'Invite insight to co-create data signals.',
        'Prototype a habit that keeps data visible.',
        'Audit the workflows touching data moments.',
        'Pair up with insight to unstick data blockers.',
        'Share a win around data with the wider team.',
        'Capture metrics that relate to data in the dashboard.',
        'Host a five-minute retro on data mid-week.',
        'Create an inspirational mood board for data.',
        'Curate a playlist that mirrors the energy of data.',
        'Draft a short story describing data success.',
        'Identify one constraint to relax around data.'
],
            checkpoints: [
        'Confidence in data today',
        'Support requested for data',
        'Signals to monitor for data',
        'Decision pending around data',
        'Celebration planned for data',
        'Learning captured about data',
        'Risk mitigation for data',
        'Data sources verifying data',
        'Stakeholders cheering data',
        'Timeline adjustments affecting data',
        'Resources to unlock data',
        'Experiments for data next'
]
        },
        {
            title: 'Experiments',
            theme: 'experiment',
            prompts: [
        'Describe how experiment shows up for this week today.',
        'List the voices who can elevate experiment right now.',
        'Capture one bold experiment connected to experiment.',
        'Note signals that confirm experiment is thriving.',
        'Document risks that could erode experiment if ignored.',
        'Imagine how experiment feels when everything clicks.',
        'Outline partnerships that reinforce experiment.',
        'Surface questions still open about experiment.',
        'Highlight a customer story that embodies experiment.',
        'Define a tiny action that nourishes experiment today.',
        'Express gratitude related to experiment moments.',
        'Sketch the momentum curve of experiment across the week.'
],
            ideas: [
        'We could celebrate experiment by amplifying insight.',
        'Invite momentum to co-create experiment signals.',
        'Prototype a habit that keeps experiment visible.',
        'Audit the workflows touching experiment moments.',
        'Pair up with momentum to unstick experiment blockers.',
        'Share a win around experiment with the wider team.',
        'Capture metrics that relate to experiment in the dashboard.',
        'Host a five-minute retro on experiment mid-week.',
        'Create an inspirational mood board for experiment.',
        'Curate a playlist that mirrors the energy of experiment.',
        'Draft a short story describing experiment success.',
        'Identify one constraint to relax around experiment.'
],
            checkpoints: [
        'Confidence in experiment today',
        'Support requested for experiment',
        'Signals to monitor for experiment',
        'Decision pending around experiment',
        'Celebration planned for experiment',
        'Learning captured about experiment',
        'Risk mitigation for experiment',
        'Data sources verifying experiment',
        'Stakeholders cheering experiment',
        'Timeline adjustments affecting experiment',
        'Resources to unlock experiment',
        'Experiments for experiment next'
]
        },
        {
            title: 'Shout-outs',
            theme: 'gratitude',
            prompts: [
        'Describe how gratitude shows up for this week today.',
        'List the voices who can elevate gratitude right now.',
        'Capture one bold experiment connected to gratitude.',
        'Note signals that confirm gratitude is thriving.',
        'Document risks that could erode gratitude if ignored.',
        'Imagine how gratitude feels when everything clicks.',
        'Outline partnerships that reinforce gratitude.',
        'Surface questions still open about gratitude.',
        'Highlight a customer story that embodies gratitude.',
        'Define a tiny action that nourishes gratitude today.',
        'Express gratitude related to gratitude moments.',
        'Sketch the momentum curve of gratitude across the week.'
],
            ideas: [
        'We could celebrate gratitude by amplifying momentum.',
        'Invite achievement to co-create gratitude signals.',
        'Prototype a habit that keeps gratitude visible.',
        'Audit the workflows touching gratitude moments.',
        'Pair up with achievement to unstick gratitude blockers.',
        'Share a win around gratitude with the wider team.',
        'Capture metrics that relate to gratitude in the dashboard.',
        'Host a five-minute retro on gratitude mid-week.',
        'Create an inspirational mood board for gratitude.',
        'Curate a playlist that mirrors the energy of gratitude.',
        'Draft a short story describing gratitude success.',
        'Identify one constraint to relax around gratitude.'
],
            checkpoints: [
        'Confidence in gratitude today',
        'Support requested for gratitude',
        'Signals to monitor for gratitude',
        'Decision pending around gratitude',
        'Celebration planned for gratitude',
        'Learning captured about gratitude',
        'Risk mitigation for gratitude',
        'Data sources verifying gratitude',
        'Stakeholders cheering gratitude',
        'Timeline adjustments affecting gratitude',
        'Resources to unlock gratitude',
        'Experiments for gratitude next'
]
        },
        {
            title: 'Learning gems',
            theme: 'insight',
            prompts: [
        'Describe how insight shows up for this week today.',
        'List the voices who can elevate insight right now.',
        'Capture one bold experiment connected to insight.',
        'Note signals that confirm insight is thriving.',
        'Document risks that could erode insight if ignored.',
        'Imagine how insight feels when everything clicks.',
        'Outline partnerships that reinforce insight.',
        'Surface questions still open about insight.',
        'Highlight a customer story that embodies insight.',
        'Define a tiny action that nourishes insight today.',
        'Express gratitude related to insight moments.',
        'Sketch the momentum curve of insight across the week.'
],
            ideas: [
        'We could celebrate insight by amplifying achievement.',
        'Invite discovery to co-create insight signals.',
        'Prototype a habit that keeps insight visible.',
        'Audit the workflows touching insight moments.',
        'Pair up with discovery to unstick insight blockers.',
        'Share a win around insight with the wider team.',
        'Capture metrics that relate to insight in the dashboard.',
        'Host a five-minute retro on insight mid-week.',
        'Create an inspirational mood board for insight.',
        'Curate a playlist that mirrors the energy of insight.',
        'Draft a short story describing insight success.',
        'Identify one constraint to relax around insight.'
],
            checkpoints: [
        'Confidence in insight today',
        'Support requested for insight',
        'Signals to monitor for insight',
        'Decision pending around insight',
        'Celebration planned for insight',
        'Learning captured about insight',
        'Risk mitigation for insight',
        'Data sources verifying insight',
        'Stakeholders cheering insight',
        'Timeline adjustments affecting insight',
        'Resources to unlock insight',
        'Experiments for insight next'
]
        },
        {
            title: 'Next bold moves',
            theme: 'momentum',
            prompts: [
        'Describe how momentum shows up for this week today.',
        'List the voices who can elevate momentum right now.',
        'Capture one bold experiment connected to momentum.',
        'Note signals that confirm momentum is thriving.',
        'Document risks that could erode momentum if ignored.',
        'Imagine how momentum feels when everything clicks.',
        'Outline partnerships that reinforce momentum.',
        'Surface questions still open about momentum.',
        'Highlight a customer story that embodies momentum.',
        'Define a tiny action that nourishes momentum today.',
        'Express gratitude related to momentum moments.',
        'Sketch the momentum curve of momentum across the week.'
],
            ideas: [
        'We could celebrate momentum by amplifying discovery.',
        'Invite challenge to co-create momentum signals.',
        'Prototype a habit that keeps momentum visible.',
        'Audit the workflows touching momentum moments.',
        'Pair up with challenge to unstick momentum blockers.',
        'Share a win around momentum with the wider team.',
        'Capture metrics that relate to momentum in the dashboard.',
        'Host a five-minute retro on momentum mid-week.',
        'Create an inspirational mood board for momentum.',
        'Curate a playlist that mirrors the energy of momentum.',
        'Draft a short story describing momentum success.',
        'Identify one constraint to relax around momentum.'
],
            checkpoints: [
        'Confidence in momentum today',
        'Support requested for momentum',
        'Signals to monitor for momentum',
        'Decision pending around momentum',
        'Celebration planned for momentum',
        'Learning captured about momentum',
        'Risk mitigation for momentum',
        'Data sources verifying momentum',
        'Stakeholders cheering momentum',
        'Timeline adjustments affecting momentum',
        'Resources to unlock momentum',
        'Experiments for momentum next'
]
        }
],
        affirmations: [
        'We protect momentum even when things wobble.',
        'Curiosity fuels every iteration we attempt.',
        'We celebrate micro-wins loudly and often.',
        'Humans first, then process, then tooling.',
        'We learn faster together than alone.',
        'Every obstacle carries a hidden insight.',
        'Joy and rigor can absolutely coexist.',
        'We narrate progress so others feel invited.',
        'Pauses are an intentional productivity move.',
        'We choose clarity over speed when needed.',
        'Listening deeply is our superpower.',
        'We prioritise kindness without losing edge.',
        'Celebration is a strategy, not an afterthought.',
        'Asking better questions unlocks better answers.',
        'We leave room for surprise and delight.',
        'Tiny experiments accumulate into bold impact.',
        'Documenting context keeps the future grateful.',
        'We signal progress with warmth and precision.',
        'Reflection is the bridge between today and tomorrow.',
        'We craft experiences that feel like a conversation.',
        'We choose achievement storyline',
        'We choose achievement highlight',
        'We choose achievement question',
        'We choose achievement invitation',
        'We choose achievement experiment',
        'We choose discovery storyline',
        'We choose discovery highlight',
        'We choose discovery question',
        'We choose discovery invitation',
        'We choose discovery experiment',
        'We choose challenge storyline',
        'We choose challenge highlight',
        'We choose challenge question',
        'We choose challenge invitation',
        'We choose challenge experiment',
        'We choose data storyline',
        'We choose data highlight',
        'We choose data question',
        'We choose data invitation',
        'We choose data experiment',
        'We choose experiment storyline',
        'We choose experiment highlight',
        'We choose experiment question',
        'We choose experiment invitation',
        'We choose experiment experiment',
        'We choose gratitude storyline',
        'We choose gratitude highlight',
        'We choose gratitude question',
        'We choose gratitude invitation',
        'We choose gratitude experiment',
        'We choose insight storyline',
        'We choose insight highlight',
        'We choose insight question',
        'We choose insight invitation',
        'We choose insight experiment',
        'We choose momentum storyline',
        'We choose momentum highlight',
        'We choose momentum question',
        'We choose momentum invitation',
        'We choose momentum experiment'
],
        defaultConfig: {
    title: 'Weekly retrospective navigator',
    tone: 'curious',
    sections: 'Celebrations,Surprises,Stumbles,Signals',
    includeReflection: true,
    customHighlights: ''
},
        form: [
        {
            key: 'title',
            label: 'Template title',
            type: 'text',
            placeholder: 'Weekly retrospective navigator'
        },
        {
            key: 'tone',
            label: 'Tone',
            type: 'select',
            options: [
        {
            value: 'curious',
            label: 'Curious'
        },
        {
            value: 'grounded',
            label: 'Grounded'
        },
        {
            value: 'optimistic',
            label: 'Optimistic'
        },
        {
            value: 'candid',
            label: 'Candid'
        },
        {
            value: 'celebratory',
            label: 'Celebratory'
        }
]
        },
        {
            key: 'sections',
            label: 'Sections to include',
            type: 'textarea',
            rows: 3,
            placeholder: 'Celebrations,Surprises,Stumbles,Signals'
        },
        {
            key: 'includeReflection',
            label: 'Add reflection prompts',
            type: 'checkbox'
        },
        {
            key: 'customHighlights',
            label: 'Custom highlights',
            type: 'textarea',
            rows: 3,
            placeholder: 'Wins to celebrate'
        }
]
    },
    {
        id: 'extended-trigger-project-kickoff',
        category: 'trigger',
        name: 'Project kickoff canvas',
        description: 'Launch a project with context, success signals, and cross-team agreements.',
        icon: 'flag',
        accent: '#22c55e',
        tags: [
        'template',
        'project',
        'alignment',
        'trigger'
],
        mode: 'template',
        topic: 'the project',
        tones: [
        'strategic',
        'hopeful',
        'pragmatic',
        'enthusiastic',
        'confident'
],
        sections: [
        {
            title: 'Vision snapshot',
            theme: 'vision',
            prompts: [
        'Describe how vision shows up for the project today.',
        'List the voices who can elevate vision right now.',
        'Capture one bold experiment connected to vision.',
        'Note signals that confirm vision is thriving.',
        'Document risks that could erode vision if ignored.',
        'Imagine how vision feels when everything clicks.',
        'Outline partnerships that reinforce vision.',
        'Surface questions still open about vision.',
        'Highlight a customer story that embodies vision.',
        'Define a tiny action that nourishes vision today.',
        'Express gratitude related to vision moments.',
        'Sketch the momentum curve of vision across the week.'
],
            ideas: [
        'We could celebrate vision by amplifying risk.',
        'Invite collaboration to co-create vision signals.',
        'Prototype a habit that keeps vision visible.',
        'Audit the workflows touching vision moments.',
        'Pair up with collaboration to unstick vision blockers.',
        'Share a win around vision with the wider team.',
        'Capture metrics that relate to vision in the dashboard.',
        'Host a five-minute retro on vision mid-week.',
        'Create an inspirational mood board for vision.',
        'Curate a playlist that mirrors the energy of vision.',
        'Draft a short story describing vision success.',
        'Identify one constraint to relax around vision.'
],
            checkpoints: [
        'Confidence in vision today',
        'Support requested for vision',
        'Signals to monitor for vision',
        'Decision pending around vision',
        'Celebration planned for vision',
        'Learning captured about vision',
        'Risk mitigation for vision',
        'Data sources verifying vision',
        'Stakeholders cheering vision',
        'Timeline adjustments affecting vision',
        'Resources to unlock vision',
        'Experiments for vision next'
]
        },
        {
            title: 'North-star outcomes',
            theme: 'outcome',
            prompts: [
        'Describe how outcome shows up for the project today.',
        'List the voices who can elevate outcome right now.',
        'Capture one bold experiment connected to outcome.',
        'Note signals that confirm outcome is thriving.',
        'Document risks that could erode outcome if ignored.',
        'Imagine how outcome feels when everything clicks.',
        'Outline partnerships that reinforce outcome.',
        'Surface questions still open about outcome.',
        'Highlight a customer story that embodies outcome.',
        'Define a tiny action that nourishes outcome today.',
        'Express gratitude related to outcome moments.',
        'Sketch the momentum curve of outcome across the week.'
],
            ideas: [
        'We could celebrate outcome by amplifying collaboration.',
        'Invite resource to co-create outcome signals.',
        'Prototype a habit that keeps outcome visible.',
        'Audit the workflows touching outcome moments.',
        'Pair up with resource to unstick outcome blockers.',
        'Share a win around outcome with the wider team.',
        'Capture metrics that relate to outcome in the dashboard.',
        'Host a five-minute retro on outcome mid-week.',
        'Create an inspirational mood board for outcome.',
        'Curate a playlist that mirrors the energy of outcome.',
        'Draft a short story describing outcome success.',
        'Identify one constraint to relax around outcome.'
],
            checkpoints: [
        'Confidence in outcome today',
        'Support requested for outcome',
        'Signals to monitor for outcome',
        'Decision pending around outcome',
        'Celebration planned for outcome',
        'Learning captured about outcome',
        'Risk mitigation for outcome',
        'Data sources verifying outcome',
        'Stakeholders cheering outcome',
        'Timeline adjustments affecting outcome',
        'Resources to unlock outcome',
        'Experiments for outcome next'
]
        },
        {
            title: 'Risks & edges',
            theme: 'risk',
            prompts: [
        'Describe how risk shows up for the project today.',
        'List the voices who can elevate risk right now.',
        'Capture one bold experiment connected to risk.',
        'Note signals that confirm risk is thriving.',
        'Document risks that could erode risk if ignored.',
        'Imagine how risk feels when everything clicks.',
        'Outline partnerships that reinforce risk.',
        'Surface questions still open about risk.',
        'Highlight a customer story that embodies risk.',
        'Define a tiny action that nourishes risk today.',
        'Express gratitude related to risk moments.',
        'Sketch the momentum curve of risk across the week.'
],
            ideas: [
        'We could celebrate risk by amplifying resource.',
        'Invite cadence to co-create risk signals.',
        'Prototype a habit that keeps risk visible.',
        'Audit the workflows touching risk moments.',
        'Pair up with cadence to unstick risk blockers.',
        'Share a win around risk with the wider team.',
        'Capture metrics that relate to risk in the dashboard.',
        'Host a five-minute retro on risk mid-week.',
        'Create an inspirational mood board for risk.',
        'Curate a playlist that mirrors the energy of risk.',
        'Draft a short story describing risk success.',
        'Identify one constraint to relax around risk.'
],
            checkpoints: [
        'Confidence in risk today',
        'Support requested for risk',
        'Signals to monitor for risk',
        'Decision pending around risk',
        'Celebration planned for risk',
        'Learning captured about risk',
        'Risk mitigation for risk',
        'Data sources verifying risk',
        'Stakeholders cheering risk',
        'Timeline adjustments affecting risk',
        'Resources to unlock risk',
        'Experiments for risk next'
]
        },
        {
            title: 'Allies & partners',
            theme: 'collaboration',
            prompts: [
        'Describe how collaboration shows up for the project today.',
        'List the voices who can elevate collaboration right now.',
        'Capture one bold experiment connected to collaboration.',
        'Note signals that confirm collaboration is thriving.',
        'Document risks that could erode collaboration if ignored.',
        'Imagine how collaboration feels when everything clicks.',
        'Outline partnerships that reinforce collaboration.',
        'Surface questions still open about collaboration.',
        'Highlight a customer story that embodies collaboration.',
        'Define a tiny action that nourishes collaboration today.',
        'Express gratitude related to collaboration moments.',
        'Sketch the momentum curve of collaboration across the week.'
],
            ideas: [
        'We could celebrate collaboration by amplifying cadence.',
        'Invite success to co-create collaboration signals.',
        'Prototype a habit that keeps collaboration visible.',
        'Audit the workflows touching collaboration moments.',
        'Pair up with success to unstick collaboration blockers.',
        'Share a win around collaboration with the wider team.',
        'Capture metrics that relate to collaboration in the dashboard.',
        'Host a five-minute retro on collaboration mid-week.',
        'Create an inspirational mood board for collaboration.',
        'Curate a playlist that mirrors the energy of collaboration.',
        'Draft a short story describing collaboration success.',
        'Identify one constraint to relax around collaboration.'
],
            checkpoints: [
        'Confidence in collaboration today',
        'Support requested for collaboration',
        'Signals to monitor for collaboration',
        'Decision pending around collaboration',
        'Celebration planned for collaboration',
        'Learning captured about collaboration',
        'Risk mitigation for collaboration',
        'Data sources verifying collaboration',
        'Stakeholders cheering collaboration',
        'Timeline adjustments affecting collaboration',
        'Resources to unlock collaboration',
        'Experiments for collaboration next'
]
        },
        {
            title: 'Resource map',
            theme: 'resource',
            prompts: [
        'Describe how resource shows up for the project today.',
        'List the voices who can elevate resource right now.',
        'Capture one bold experiment connected to resource.',
        'Note signals that confirm resource is thriving.',
        'Document risks that could erode resource if ignored.',
        'Imagine how resource feels when everything clicks.',
        'Outline partnerships that reinforce resource.',
        'Surface questions still open about resource.',
        'Highlight a customer story that embodies resource.',
        'Define a tiny action that nourishes resource today.',
        'Express gratitude related to resource moments.',
        'Sketch the momentum curve of resource across the week.'
],
            ideas: [
        'We could celebrate resource by amplifying success.',
        'Invite readiness to co-create resource signals.',
        'Prototype a habit that keeps resource visible.',
        'Audit the workflows touching resource moments.',
        'Pair up with readiness to unstick resource blockers.',
        'Share a win around resource with the wider team.',
        'Capture metrics that relate to resource in the dashboard.',
        'Host a five-minute retro on resource mid-week.',
        'Create an inspirational mood board for resource.',
        'Curate a playlist that mirrors the energy of resource.',
        'Draft a short story describing resource success.',
        'Identify one constraint to relax around resource.'
],
            checkpoints: [
        'Confidence in resource today',
        'Support requested for resource',
        'Signals to monitor for resource',
        'Decision pending around resource',
        'Celebration planned for resource',
        'Learning captured about resource',
        'Risk mitigation for resource',
        'Data sources verifying resource',
        'Stakeholders cheering resource',
        'Timeline adjustments affecting resource',
        'Resources to unlock resource',
        'Experiments for resource next'
]
        },
        {
            title: 'Decision cadence',
            theme: 'cadence',
            prompts: [
        'Describe how cadence shows up for the project today.',
        'List the voices who can elevate cadence right now.',
        'Capture one bold experiment connected to cadence.',
        'Note signals that confirm cadence is thriving.',
        'Document risks that could erode cadence if ignored.',
        'Imagine how cadence feels when everything clicks.',
        'Outline partnerships that reinforce cadence.',
        'Surface questions still open about cadence.',
        'Highlight a customer story that embodies cadence.',
        'Define a tiny action that nourishes cadence today.',
        'Express gratitude related to cadence moments.',
        'Sketch the momentum curve of cadence across the week.'
],
            ideas: [
        'We could celebrate cadence by amplifying readiness.',
        'Invite vision to co-create cadence signals.',
        'Prototype a habit that keeps cadence visible.',
        'Audit the workflows touching cadence moments.',
        'Pair up with vision to unstick cadence blockers.',
        'Share a win around cadence with the wider team.',
        'Capture metrics that relate to cadence in the dashboard.',
        'Host a five-minute retro on cadence mid-week.',
        'Create an inspirational mood board for cadence.',
        'Curate a playlist that mirrors the energy of cadence.',
        'Draft a short story describing cadence success.',
        'Identify one constraint to relax around cadence.'
],
            checkpoints: [
        'Confidence in cadence today',
        'Support requested for cadence',
        'Signals to monitor for cadence',
        'Decision pending around cadence',
        'Celebration planned for cadence',
        'Learning captured about cadence',
        'Risk mitigation for cadence',
        'Data sources verifying cadence',
        'Stakeholders cheering cadence',
        'Timeline adjustments affecting cadence',
        'Resources to unlock cadence',
        'Experiments for cadence next'
]
        },
        {
            title: 'Success rituals',
            theme: 'success',
            prompts: [
        'Describe how success shows up for the project today.',
        'List the voices who can elevate success right now.',
        'Capture one bold experiment connected to success.',
        'Note signals that confirm success is thriving.',
        'Document risks that could erode success if ignored.',
        'Imagine how success feels when everything clicks.',
        'Outline partnerships that reinforce success.',
        'Surface questions still open about success.',
        'Highlight a customer story that embodies success.',
        'Define a tiny action that nourishes success today.',
        'Express gratitude related to success moments.',
        'Sketch the momentum curve of success across the week.'
],
            ideas: [
        'We could celebrate success by amplifying vision.',
        'Invite outcome to co-create success signals.',
        'Prototype a habit that keeps success visible.',
        'Audit the workflows touching success moments.',
        'Pair up with outcome to unstick success blockers.',
        'Share a win around success with the wider team.',
        'Capture metrics that relate to success in the dashboard.',
        'Host a five-minute retro on success mid-week.',
        'Create an inspirational mood board for success.',
        'Curate a playlist that mirrors the energy of success.',
        'Draft a short story describing success success.',
        'Identify one constraint to relax around success.'
],
            checkpoints: [
        'Confidence in success today',
        'Support requested for success',
        'Signals to monitor for success',
        'Decision pending around success',
        'Celebration planned for success',
        'Learning captured about success',
        'Risk mitigation for success',
        'Data sources verifying success',
        'Stakeholders cheering success',
        'Timeline adjustments affecting success',
        'Resources to unlock success',
        'Experiments for success next'
]
        },
        {
            title: 'Launch checklist',
            theme: 'readiness',
            prompts: [
        'Describe how readiness shows up for the project today.',
        'List the voices who can elevate readiness right now.',
        'Capture one bold experiment connected to readiness.',
        'Note signals that confirm readiness is thriving.',
        'Document risks that could erode readiness if ignored.',
        'Imagine how readiness feels when everything clicks.',
        'Outline partnerships that reinforce readiness.',
        'Surface questions still open about readiness.',
        'Highlight a customer story that embodies readiness.',
        'Define a tiny action that nourishes readiness today.',
        'Express gratitude related to readiness moments.',
        'Sketch the momentum curve of readiness across the week.'
],
            ideas: [
        'We could celebrate readiness by amplifying outcome.',
        'Invite risk to co-create readiness signals.',
        'Prototype a habit that keeps readiness visible.',
        'Audit the workflows touching readiness moments.',
        'Pair up with risk to unstick readiness blockers.',
        'Share a win around readiness with the wider team.',
        'Capture metrics that relate to readiness in the dashboard.',
        'Host a five-minute retro on readiness mid-week.',
        'Create an inspirational mood board for readiness.',
        'Curate a playlist that mirrors the energy of readiness.',
        'Draft a short story describing readiness success.',
        'Identify one constraint to relax around readiness.'
],
            checkpoints: [
        'Confidence in readiness today',
        'Support requested for readiness',
        'Signals to monitor for readiness',
        'Decision pending around readiness',
        'Celebration planned for readiness',
        'Learning captured about readiness',
        'Risk mitigation for readiness',
        'Data sources verifying readiness',
        'Stakeholders cheering readiness',
        'Timeline adjustments affecting readiness',
        'Resources to unlock readiness',
        'Experiments for readiness next'
]
        }
],
        affirmations: [
        'We protect momentum even when things wobble.',
        'Curiosity fuels every iteration we attempt.',
        'We celebrate micro-wins loudly and often.',
        'Humans first, then process, then tooling.',
        'We learn faster together than alone.',
        'Every obstacle carries a hidden insight.',
        'Joy and rigor can absolutely coexist.',
        'We narrate progress so others feel invited.',
        'Pauses are an intentional productivity move.',
        'We choose clarity over speed when needed.',
        'Listening deeply is our superpower.',
        'We prioritise kindness without losing edge.',
        'Celebration is a strategy, not an afterthought.',
        'Asking better questions unlocks better answers.',
        'We leave room for surprise and delight.',
        'Tiny experiments accumulate into bold impact.',
        'Documenting context keeps the future grateful.',
        'We signal progress with warmth and precision.',
        'Reflection is the bridge between today and tomorrow.',
        'We craft experiences that feel like a conversation.',
        'We choose vision storyline',
        'We choose vision highlight',
        'We choose vision question',
        'We choose vision invitation',
        'We choose vision experiment',
        'We choose outcome storyline',
        'We choose outcome highlight',
        'We choose outcome question',
        'We choose outcome invitation',
        'We choose outcome experiment',
        'We choose risk storyline',
        'We choose risk highlight',
        'We choose risk question',
        'We choose risk invitation',
        'We choose risk experiment',
        'We choose collaboration storyline',
        'We choose collaboration highlight',
        'We choose collaboration question',
        'We choose collaboration invitation',
        'We choose collaboration experiment',
        'We choose resource storyline',
        'We choose resource highlight',
        'We choose resource question',
        'We choose resource invitation',
        'We choose resource experiment',
        'We choose cadence storyline',
        'We choose cadence highlight',
        'We choose cadence question',
        'We choose cadence invitation',
        'We choose cadence experiment',
        'We choose success storyline',
        'We choose success highlight',
        'We choose success question',
        'We choose success invitation',
        'We choose success experiment',
        'We choose readiness storyline',
        'We choose readiness highlight',
        'We choose readiness question',
        'We choose readiness invitation',
        'We choose readiness experiment'
],
        defaultConfig: {
    title: 'Project kickoff canvas',
    tone: 'strategic',
    sections: 'Vision snapshot,North-star outcomes,Risks & edges,Allies & partners',
    includeReflection: true,
    customHighlights: ''
},
        form: [
        {
            key: 'title',
            label: 'Template title',
            type: 'text',
            placeholder: 'Project kickoff canvas'
        },
        {
            key: 'tone',
            label: 'Tone',
            type: 'select',
            options: [
        {
            value: 'strategic',
            label: 'Strategic'
        },
        {
            value: 'hopeful',
            label: 'Hopeful'
        },
        {
            value: 'pragmatic',
            label: 'Pragmatic'
        },
        {
            value: 'enthusiastic',
            label: 'Enthusiastic'
        },
        {
            value: 'confident',
            label: 'Confident'
        }
]
        },
        {
            key: 'sections',
            label: 'Sections to include',
            type: 'textarea',
            rows: 3,
            placeholder: 'Vision snapshot,North-star outcomes,Risks & edges,Allies & partners'
        },
        {
            key: 'includeReflection',
            label: 'Add reflection prompts',
            type: 'checkbox'
        },
        {
            key: 'customHighlights',
            label: 'Custom highlights',
            type: 'textarea',
            rows: 3,
            placeholder: 'Wins to celebrate'
        }
]
    },
    {
        id: 'extended-trigger-design-review',
        category: 'trigger',
        name: 'Design review storyline',
        description: 'Frame a review conversation with narrative context, decisions, and critique prompts.',
        icon: 'layout',
        accent: '#ec4899',
        tags: [
        'template',
        'design',
        'feedback',
        'trigger'
],
        mode: 'template',
        topic: 'the design',
        tones: [
        'insightful',
        'playful',
        'curious',
        'bold',
        'empathetic'
],
        sections: [
        {
            title: 'Narrative snapshot',
            theme: 'story',
            prompts: [
        'Describe how story shows up for the design today.',
        'List the voices who can elevate story right now.',
        'Capture one bold experiment connected to story.',
        'Note signals that confirm story is thriving.',
        'Document risks that could erode story if ignored.',
        'Imagine how story feels when everything clicks.',
        'Outline partnerships that reinforce story.',
        'Surface questions still open about story.',
        'Highlight a customer story that embodies story.',
        'Define a tiny action that nourishes story today.',
        'Express gratitude related to story moments.',
        'Sketch the momentum curve of story across the week.'
],
            ideas: [
        'We could celebrate story by amplifying audience.',
        'Invite exploration to co-create story signals.',
        'Prototype a habit that keeps story visible.',
        'Audit the workflows touching story moments.',
        'Pair up with exploration to unstick story blockers.',
        'Share a win around story with the wider team.',
        'Capture metrics that relate to story in the dashboard.',
        'Host a five-minute retro on story mid-week.',
        'Create an inspirational mood board for story.',
        'Curate a playlist that mirrors the energy of story.',
        'Draft a short story describing story success.',
        'Identify one constraint to relax around story.'
],
            checkpoints: [
        'Confidence in story today',
        'Support requested for story',
        'Signals to monitor for story',
        'Decision pending around story',
        'Celebration planned for story',
        'Learning captured about story',
        'Risk mitigation for story',
        'Data sources verifying story',
        'Stakeholders cheering story',
        'Timeline adjustments affecting story',
        'Resources to unlock story',
        'Experiments for story next'
]
        },
        {
            title: 'Problem framing',
            theme: 'problem',
            prompts: [
        'Describe how problem shows up for the design today.',
        'List the voices who can elevate problem right now.',
        'Capture one bold experiment connected to problem.',
        'Note signals that confirm problem is thriving.',
        'Document risks that could erode problem if ignored.',
        'Imagine how problem feels when everything clicks.',
        'Outline partnerships that reinforce problem.',
        'Surface questions still open about problem.',
        'Highlight a customer story that embodies problem.',
        'Define a tiny action that nourishes problem today.',
        'Express gratitude related to problem moments.',
        'Sketch the momentum curve of problem across the week.'
],
            ideas: [
        'We could celebrate problem by amplifying exploration.',
        'Invite trade-off to co-create problem signals.',
        'Prototype a habit that keeps problem visible.',
        'Audit the workflows touching problem moments.',
        'Pair up with trade-off to unstick problem blockers.',
        'Share a win around problem with the wider team.',
        'Capture metrics that relate to problem in the dashboard.',
        'Host a five-minute retro on problem mid-week.',
        'Create an inspirational mood board for problem.',
        'Curate a playlist that mirrors the energy of problem.',
        'Draft a short story describing problem success.',
        'Identify one constraint to relax around problem.'
],
            checkpoints: [
        'Confidence in problem today',
        'Support requested for problem',
        'Signals to monitor for problem',
        'Decision pending around problem',
        'Celebration planned for problem',
        'Learning captured about problem',
        'Risk mitigation for problem',
        'Data sources verifying problem',
        'Stakeholders cheering problem',
        'Timeline adjustments affecting problem',
        'Resources to unlock problem',
        'Experiments for problem next'
]
        },
        {
            title: 'Audience signals',
            theme: 'audience',
            prompts: [
        'Describe how audience shows up for the design today.',
        'List the voices who can elevate audience right now.',
        'Capture one bold experiment connected to audience.',
        'Note signals that confirm audience is thriving.',
        'Document risks that could erode audience if ignored.',
        'Imagine how audience feels when everything clicks.',
        'Outline partnerships that reinforce audience.',
        'Surface questions still open about audience.',
        'Highlight a customer story that embodies audience.',
        'Define a tiny action that nourishes audience today.',
        'Express gratitude related to audience moments.',
        'Sketch the momentum curve of audience across the week.'
],
            ideas: [
        'We could celebrate audience by amplifying trade-off.',
        'Invite feedback to co-create audience signals.',
        'Prototype a habit that keeps audience visible.',
        'Audit the workflows touching audience moments.',
        'Pair up with feedback to unstick audience blockers.',
        'Share a win around audience with the wider team.',
        'Capture metrics that relate to audience in the dashboard.',
        'Host a five-minute retro on audience mid-week.',
        'Create an inspirational mood board for audience.',
        'Curate a playlist that mirrors the energy of audience.',
        'Draft a short story describing audience success.',
        'Identify one constraint to relax around audience.'
],
            checkpoints: [
        'Confidence in audience today',
        'Support requested for audience',
        'Signals to monitor for audience',
        'Decision pending around audience',
        'Celebration planned for audience',
        'Learning captured about audience',
        'Risk mitigation for audience',
        'Data sources verifying audience',
        'Stakeholders cheering audience',
        'Timeline adjustments affecting audience',
        'Resources to unlock audience',
        'Experiments for audience next'
]
        },
        {
            title: 'Exploration paths',
            theme: 'exploration',
            prompts: [
        'Describe how exploration shows up for the design today.',
        'List the voices who can elevate exploration right now.',
        'Capture one bold experiment connected to exploration.',
        'Note signals that confirm exploration is thriving.',
        'Document risks that could erode exploration if ignored.',
        'Imagine how exploration feels when everything clicks.',
        'Outline partnerships that reinforce exploration.',
        'Surface questions still open about exploration.',
        'Highlight a customer story that embodies exploration.',
        'Define a tiny action that nourishes exploration today.',
        'Express gratitude related to exploration moments.',
        'Sketch the momentum curve of exploration across the week.'
],
            ideas: [
        'We could celebrate exploration by amplifying feedback.',
        'Invite decision to co-create exploration signals.',
        'Prototype a habit that keeps exploration visible.',
        'Audit the workflows touching exploration moments.',
        'Pair up with decision to unstick exploration blockers.',
        'Share a win around exploration with the wider team.',
        'Capture metrics that relate to exploration in the dashboard.',
        'Host a five-minute retro on exploration mid-week.',
        'Create an inspirational mood board for exploration.',
        'Curate a playlist that mirrors the energy of exploration.',
        'Draft a short story describing exploration success.',
        'Identify one constraint to relax around exploration.'
],
            checkpoints: [
        'Confidence in exploration today',
        'Support requested for exploration',
        'Signals to monitor for exploration',
        'Decision pending around exploration',
        'Celebration planned for exploration',
        'Learning captured about exploration',
        'Risk mitigation for exploration',
        'Data sources verifying exploration',
        'Stakeholders cheering exploration',
        'Timeline adjustments affecting exploration',
        'Resources to unlock exploration',
        'Experiments for exploration next'
]
        },
        {
            title: 'Trade-off map',
            theme: 'trade-off',
            prompts: [
        'Describe how trade-off shows up for the design today.',
        'List the voices who can elevate trade-off right now.',
        'Capture one bold experiment connected to trade-off.',
        'Note signals that confirm trade-off is thriving.',
        'Document risks that could erode trade-off if ignored.',
        'Imagine how trade-off feels when everything clicks.',
        'Outline partnerships that reinforce trade-off.',
        'Surface questions still open about trade-off.',
        'Highlight a customer story that embodies trade-off.',
        'Define a tiny action that nourishes trade-off today.',
        'Express gratitude related to trade-off moments.',
        'Sketch the momentum curve of trade-off across the week.'
],
            ideas: [
        'We could celebrate trade-off by amplifying decision.',
        'Invite momentum to co-create trade-off signals.',
        'Prototype a habit that keeps trade-off visible.',
        'Audit the workflows touching trade-off moments.',
        'Pair up with momentum to unstick trade-off blockers.',
        'Share a win around trade-off with the wider team.',
        'Capture metrics that relate to trade-off in the dashboard.',
        'Host a five-minute retro on trade-off mid-week.',
        'Create an inspirational mood board for trade-off.',
        'Curate a playlist that mirrors the energy of trade-off.',
        'Draft a short story describing trade-off success.',
        'Identify one constraint to relax around trade-off.'
],
            checkpoints: [
        'Confidence in trade-off today',
        'Support requested for trade-off',
        'Signals to monitor for trade-off',
        'Decision pending around trade-off',
        'Celebration planned for trade-off',
        'Learning captured about trade-off',
        'Risk mitigation for trade-off',
        'Data sources verifying trade-off',
        'Stakeholders cheering trade-off',
        'Timeline adjustments affecting trade-off',
        'Resources to unlock trade-off',
        'Experiments for trade-off next'
]
        },
        {
            title: 'Feedback quests',
            theme: 'feedback',
            prompts: [
        'Describe how feedback shows up for the design today.',
        'List the voices who can elevate feedback right now.',
        'Capture one bold experiment connected to feedback.',
        'Note signals that confirm feedback is thriving.',
        'Document risks that could erode feedback if ignored.',
        'Imagine how feedback feels when everything clicks.',
        'Outline partnerships that reinforce feedback.',
        'Surface questions still open about feedback.',
        'Highlight a customer story that embodies feedback.',
        'Define a tiny action that nourishes feedback today.',
        'Express gratitude related to feedback moments.',
        'Sketch the momentum curve of feedback across the week.'
],
            ideas: [
        'We could celebrate feedback by amplifying momentum.',
        'Invite story to co-create feedback signals.',
        'Prototype a habit that keeps feedback visible.',
        'Audit the workflows touching feedback moments.',
        'Pair up with story to unstick feedback blockers.',
        'Share a win around feedback with the wider team.',
        'Capture metrics that relate to feedback in the dashboard.',
        'Host a five-minute retro on feedback mid-week.',
        'Create an inspirational mood board for feedback.',
        'Curate a playlist that mirrors the energy of feedback.',
        'Draft a short story describing feedback success.',
        'Identify one constraint to relax around feedback.'
],
            checkpoints: [
        'Confidence in feedback today',
        'Support requested for feedback',
        'Signals to monitor for feedback',
        'Decision pending around feedback',
        'Celebration planned for feedback',
        'Learning captured about feedback',
        'Risk mitigation for feedback',
        'Data sources verifying feedback',
        'Stakeholders cheering feedback',
        'Timeline adjustments affecting feedback',
        'Resources to unlock feedback',
        'Experiments for feedback next'
]
        },
        {
            title: 'Decision log',
            theme: 'decision',
            prompts: [
        'Describe how decision shows up for the design today.',
        'List the voices who can elevate decision right now.',
        'Capture one bold experiment connected to decision.',
        'Note signals that confirm decision is thriving.',
        'Document risks that could erode decision if ignored.',
        'Imagine how decision feels when everything clicks.',
        'Outline partnerships that reinforce decision.',
        'Surface questions still open about decision.',
        'Highlight a customer story that embodies decision.',
        'Define a tiny action that nourishes decision today.',
        'Express gratitude related to decision moments.',
        'Sketch the momentum curve of decision across the week.'
],
            ideas: [
        'We could celebrate decision by amplifying story.',
        'Invite problem to co-create decision signals.',
        'Prototype a habit that keeps decision visible.',
        'Audit the workflows touching decision moments.',
        'Pair up with problem to unstick decision blockers.',
        'Share a win around decision with the wider team.',
        'Capture metrics that relate to decision in the dashboard.',
        'Host a five-minute retro on decision mid-week.',
        'Create an inspirational mood board for decision.',
        'Curate a playlist that mirrors the energy of decision.',
        'Draft a short story describing decision success.',
        'Identify one constraint to relax around decision.'
],
            checkpoints: [
        'Confidence in decision today',
        'Support requested for decision',
        'Signals to monitor for decision',
        'Decision pending around decision',
        'Celebration planned for decision',
        'Learning captured about decision',
        'Risk mitigation for decision',
        'Data sources verifying decision',
        'Stakeholders cheering decision',
        'Timeline adjustments affecting decision',
        'Resources to unlock decision',
        'Experiments for decision next'
]
        },
        {
            title: 'Next leaps',
            theme: 'momentum',
            prompts: [
        'Describe how momentum shows up for the design today.',
        'List the voices who can elevate momentum right now.',
        'Capture one bold experiment connected to momentum.',
        'Note signals that confirm momentum is thriving.',
        'Document risks that could erode momentum if ignored.',
        'Imagine how momentum feels when everything clicks.',
        'Outline partnerships that reinforce momentum.',
        'Surface questions still open about momentum.',
        'Highlight a customer story that embodies momentum.',
        'Define a tiny action that nourishes momentum today.',
        'Express gratitude related to momentum moments.',
        'Sketch the momentum curve of momentum across the week.'
],
            ideas: [
        'We could celebrate momentum by amplifying problem.',
        'Invite audience to co-create momentum signals.',
        'Prototype a habit that keeps momentum visible.',
        'Audit the workflows touching momentum moments.',
        'Pair up with audience to unstick momentum blockers.',
        'Share a win around momentum with the wider team.',
        'Capture metrics that relate to momentum in the dashboard.',
        'Host a five-minute retro on momentum mid-week.',
        'Create an inspirational mood board for momentum.',
        'Curate a playlist that mirrors the energy of momentum.',
        'Draft a short story describing momentum success.',
        'Identify one constraint to relax around momentum.'
],
            checkpoints: [
        'Confidence in momentum today',
        'Support requested for momentum',
        'Signals to monitor for momentum',
        'Decision pending around momentum',
        'Celebration planned for momentum',
        'Learning captured about momentum',
        'Risk mitigation for momentum',
        'Data sources verifying momentum',
        'Stakeholders cheering momentum',
        'Timeline adjustments affecting momentum',
        'Resources to unlock momentum',
        'Experiments for momentum next'
]
        }
],
        affirmations: [
        'We protect momentum even when things wobble.',
        'Curiosity fuels every iteration we attempt.',
        'We celebrate micro-wins loudly and often.',
        'Humans first, then process, then tooling.',
        'We learn faster together than alone.',
        'Every obstacle carries a hidden insight.',
        'Joy and rigor can absolutely coexist.',
        'We narrate progress so others feel invited.',
        'Pauses are an intentional productivity move.',
        'We choose clarity over speed when needed.',
        'Listening deeply is our superpower.',
        'We prioritise kindness without losing edge.',
        'Celebration is a strategy, not an afterthought.',
        'Asking better questions unlocks better answers.',
        'We leave room for surprise and delight.',
        'Tiny experiments accumulate into bold impact.',
        'Documenting context keeps the future grateful.',
        'We signal progress with warmth and precision.',
        'Reflection is the bridge between today and tomorrow.',
        'We craft experiences that feel like a conversation.',
        'We choose story storyline',
        'We choose story highlight',
        'We choose story question',
        'We choose story invitation',
        'We choose story experiment',
        'We choose problem storyline',
        'We choose problem highlight',
        'We choose problem question',
        'We choose problem invitation',
        'We choose problem experiment',
        'We choose audience storyline',
        'We choose audience highlight',
        'We choose audience question',
        'We choose audience invitation',
        'We choose audience experiment',
        'We choose exploration storyline',
        'We choose exploration highlight',
        'We choose exploration question',
        'We choose exploration invitation',
        'We choose exploration experiment',
        'We choose trade-off storyline',
        'We choose trade-off highlight',
        'We choose trade-off question',
        'We choose trade-off invitation',
        'We choose trade-off experiment',
        'We choose feedback storyline',
        'We choose feedback highlight',
        'We choose feedback question',
        'We choose feedback invitation',
        'We choose feedback experiment',
        'We choose decision storyline',
        'We choose decision highlight',
        'We choose decision question',
        'We choose decision invitation',
        'We choose decision experiment',
        'We choose momentum storyline',
        'We choose momentum highlight',
        'We choose momentum question',
        'We choose momentum invitation',
        'We choose momentum experiment'
],
        defaultConfig: {
    title: 'Design review storyline',
    tone: 'insightful',
    sections: 'Narrative snapshot,Problem framing,Audience signals,Exploration paths',
    includeReflection: true,
    customHighlights: ''
},
        form: [
        {
            key: 'title',
            label: 'Template title',
            type: 'text',
            placeholder: 'Design review storyline'
        },
        {
            key: 'tone',
            label: 'Tone',
            type: 'select',
            options: [
        {
            value: 'insightful',
            label: 'Insightful'
        },
        {
            value: 'playful',
            label: 'Playful'
        },
        {
            value: 'curious',
            label: 'Curious'
        },
        {
            value: 'bold',
            label: 'Bold'
        },
        {
            value: 'empathetic',
            label: 'Empathetic'
        }
]
        },
        {
            key: 'sections',
            label: 'Sections to include',
            type: 'textarea',
            rows: 3,
            placeholder: 'Narrative snapshot,Problem framing,Audience signals,Exploration paths'
        },
        {
            key: 'includeReflection',
            label: 'Add reflection prompts',
            type: 'checkbox'
        },
        {
            key: 'customHighlights',
            label: 'Custom highlights',
            type: 'textarea',
            rows: 3,
            placeholder: 'Wins to celebrate'
        }
]
    },
    {
        id: 'extended-trigger-product-brief',
        category: 'trigger',
        name: 'Product briefing companion',
        description: 'Curate a concise product brief with context, needs, and storytelling elements.',
        icon: 'box',
        accent: '#0ea5e9',
        tags: [
        'template',
        'product',
        'story',
        'trigger'
],
        mode: 'template',
        topic: 'the product',
        tones: [
        'narrative',
        'confident',
        'empathetic',
        'visionary',
        'playful'
],
        sections: [
        {
            title: 'Origin story',
            theme: 'origin',
            prompts: [
        'Describe how origin shows up for the product today.',
        'List the voices who can elevate origin right now.',
        'Capture one bold experiment connected to origin.',
        'Note signals that confirm origin is thriving.',
        'Document risks that could erode origin if ignored.',
        'Imagine how origin feels when everything clicks.',
        'Outline partnerships that reinforce origin.',
        'Surface questions still open about origin.',
        'Highlight a customer story that embodies origin.',
        'Define a tiny action that nourishes origin today.',
        'Express gratitude related to origin moments.',
        'Sketch the momentum curve of origin across the week.'
],
            ideas: [
        'We could celebrate origin by amplifying pain.',
        'Invite promise to co-create origin signals.',
        'Prototype a habit that keeps origin visible.',
        'Audit the workflows touching origin moments.',
        'Pair up with promise to unstick origin blockers.',
        'Share a win around origin with the wider team.',
        'Capture metrics that relate to origin in the dashboard.',
        'Host a five-minute retro on origin mid-week.',
        'Create an inspirational mood board for origin.',
        'Curate a playlist that mirrors the energy of origin.',
        'Draft a short story describing origin success.',
        'Identify one constraint to relax around origin.'
],
            checkpoints: [
        'Confidence in origin today',
        'Support requested for origin',
        'Signals to monitor for origin',
        'Decision pending around origin',
        'Celebration planned for origin',
        'Learning captured about origin',
        'Risk mitigation for origin',
        'Data sources verifying origin',
        'Stakeholders cheering origin',
        'Timeline adjustments affecting origin',
        'Resources to unlock origin',
        'Experiments for origin next'
]
        },
        {
            title: 'Audience snapshot',
            theme: 'audience',
            prompts: [
        'Describe how audience shows up for the product today.',
        'List the voices who can elevate audience right now.',
        'Capture one bold experiment connected to audience.',
        'Note signals that confirm audience is thriving.',
        'Document risks that could erode audience if ignored.',
        'Imagine how audience feels when everything clicks.',
        'Outline partnerships that reinforce audience.',
        'Surface questions still open about audience.',
        'Highlight a customer story that embodies audience.',
        'Define a tiny action that nourishes audience today.',
        'Express gratitude related to audience moments.',
        'Sketch the momentum curve of audience across the week.'
],
            ideas: [
        'We could celebrate audience by amplifying promise.',
        'Invite edge to co-create audience signals.',
        'Prototype a habit that keeps audience visible.',
        'Audit the workflows touching audience moments.',
        'Pair up with edge to unstick audience blockers.',
        'Share a win around audience with the wider team.',
        'Capture metrics that relate to audience in the dashboard.',
        'Host a five-minute retro on audience mid-week.',
        'Create an inspirational mood board for audience.',
        'Curate a playlist that mirrors the energy of audience.',
        'Draft a short story describing audience success.',
        'Identify one constraint to relax around audience.'
],
            checkpoints: [
        'Confidence in audience today',
        'Support requested for audience',
        'Signals to monitor for audience',
        'Decision pending around audience',
        'Celebration planned for audience',
        'Learning captured about audience',
        'Risk mitigation for audience',
        'Data sources verifying audience',
        'Stakeholders cheering audience',
        'Timeline adjustments affecting audience',
        'Resources to unlock audience',
        'Experiments for audience next'
]
        },
        {
            title: 'Pain-point mural',
            theme: 'pain',
            prompts: [
        'Describe how pain shows up for the product today.',
        'List the voices who can elevate pain right now.',
        'Capture one bold experiment connected to pain.',
        'Note signals that confirm pain is thriving.',
        'Document risks that could erode pain if ignored.',
        'Imagine how pain feels when everything clicks.',
        'Outline partnerships that reinforce pain.',
        'Surface questions still open about pain.',
        'Highlight a customer story that embodies pain.',
        'Define a tiny action that nourishes pain today.',
        'Express gratitude related to pain moments.',
        'Sketch the momentum curve of pain across the week.'
],
            ideas: [
        'We could celebrate pain by amplifying edge.',
        'Invite adoption to co-create pain signals.',
        'Prototype a habit that keeps pain visible.',
        'Audit the workflows touching pain moments.',
        'Pair up with adoption to unstick pain blockers.',
        'Share a win around pain with the wider team.',
        'Capture metrics that relate to pain in the dashboard.',
        'Host a five-minute retro on pain mid-week.',
        'Create an inspirational mood board for pain.',
        'Curate a playlist that mirrors the energy of pain.',
        'Draft a short story describing pain success.',
        'Identify one constraint to relax around pain.'
],
            checkpoints: [
        'Confidence in pain today',
        'Support requested for pain',
        'Signals to monitor for pain',
        'Decision pending around pain',
        'Celebration planned for pain',
        'Learning captured about pain',
        'Risk mitigation for pain',
        'Data sources verifying pain',
        'Stakeholders cheering pain',
        'Timeline adjustments affecting pain',
        'Resources to unlock pain',
        'Experiments for pain next'
]
        },
        {
            title: 'Promise statement',
            theme: 'promise',
            prompts: [
        'Describe how promise shows up for the product today.',
        'List the voices who can elevate promise right now.',
        'Capture one bold experiment connected to promise.',
        'Note signals that confirm promise is thriving.',
        'Document risks that could erode promise if ignored.',
        'Imagine how promise feels when everything clicks.',
        'Outline partnerships that reinforce promise.',
        'Surface questions still open about promise.',
        'Highlight a customer story that embodies promise.',
        'Define a tiny action that nourishes promise today.',
        'Express gratitude related to promise moments.',
        'Sketch the momentum curve of promise across the week.'
],
            ideas: [
        'We could celebrate promise by amplifying adoption.',
        'Invite metrics to co-create promise signals.',
        'Prototype a habit that keeps promise visible.',
        'Audit the workflows touching promise moments.',
        'Pair up with metrics to unstick promise blockers.',
        'Share a win around promise with the wider team.',
        'Capture metrics that relate to promise in the dashboard.',
        'Host a five-minute retro on promise mid-week.',
        'Create an inspirational mood board for promise.',
        'Curate a playlist that mirrors the energy of promise.',
        'Draft a short story describing promise success.',
        'Identify one constraint to relax around promise.'
],
            checkpoints: [
        'Confidence in promise today',
        'Support requested for promise',
        'Signals to monitor for promise',
        'Decision pending around promise',
        'Celebration planned for promise',
        'Learning captured about promise',
        'Risk mitigation for promise',
        'Data sources verifying promise',
        'Stakeholders cheering promise',
        'Timeline adjustments affecting promise',
        'Resources to unlock promise',
        'Experiments for promise next'
]
        },
        {
            title: 'Differentiators',
            theme: 'edge',
            prompts: [
        'Describe how edge shows up for the product today.',
        'List the voices who can elevate edge right now.',
        'Capture one bold experiment connected to edge.',
        'Note signals that confirm edge is thriving.',
        'Document risks that could erode edge if ignored.',
        'Imagine how edge feels when everything clicks.',
        'Outline partnerships that reinforce edge.',
        'Surface questions still open about edge.',
        'Highlight a customer story that embodies edge.',
        'Define a tiny action that nourishes edge today.',
        'Express gratitude related to edge moments.',
        'Sketch the momentum curve of edge across the week.'
],
            ideas: [
        'We could celebrate edge by amplifying metrics.',
        'Invite launch to co-create edge signals.',
        'Prototype a habit that keeps edge visible.',
        'Audit the workflows touching edge moments.',
        'Pair up with launch to unstick edge blockers.',
        'Share a win around edge with the wider team.',
        'Capture metrics that relate to edge in the dashboard.',
        'Host a five-minute retro on edge mid-week.',
        'Create an inspirational mood board for edge.',
        'Curate a playlist that mirrors the energy of edge.',
        'Draft a short story describing edge success.',
        'Identify one constraint to relax around edge.'
],
            checkpoints: [
        'Confidence in edge today',
        'Support requested for edge',
        'Signals to monitor for edge',
        'Decision pending around edge',
        'Celebration planned for edge',
        'Learning captured about edge',
        'Risk mitigation for edge',
        'Data sources verifying edge',
        'Stakeholders cheering edge',
        'Timeline adjustments affecting edge',
        'Resources to unlock edge',
        'Experiments for edge next'
]
        },
        {
            title: 'Adoption sparks',
            theme: 'adoption',
            prompts: [
        'Describe how adoption shows up for the product today.',
        'List the voices who can elevate adoption right now.',
        'Capture one bold experiment connected to adoption.',
        'Note signals that confirm adoption is thriving.',
        'Document risks that could erode adoption if ignored.',
        'Imagine how adoption feels when everything clicks.',
        'Outline partnerships that reinforce adoption.',
        'Surface questions still open about adoption.',
        'Highlight a customer story that embodies adoption.',
        'Define a tiny action that nourishes adoption today.',
        'Express gratitude related to adoption moments.',
        'Sketch the momentum curve of adoption across the week.'
],
            ideas: [
        'We could celebrate adoption by amplifying launch.',
        'Invite origin to co-create adoption signals.',
        'Prototype a habit that keeps adoption visible.',
        'Audit the workflows touching adoption moments.',
        'Pair up with origin to unstick adoption blockers.',
        'Share a win around adoption with the wider team.',
        'Capture metrics that relate to adoption in the dashboard.',
        'Host a five-minute retro on adoption mid-week.',
        'Create an inspirational mood board for adoption.',
        'Curate a playlist that mirrors the energy of adoption.',
        'Draft a short story describing adoption success.',
        'Identify one constraint to relax around adoption.'
],
            checkpoints: [
        'Confidence in adoption today',
        'Support requested for adoption',
        'Signals to monitor for adoption',
        'Decision pending around adoption',
        'Celebration planned for adoption',
        'Learning captured about adoption',
        'Risk mitigation for adoption',
        'Data sources verifying adoption',
        'Stakeholders cheering adoption',
        'Timeline adjustments affecting adoption',
        'Resources to unlock adoption',
        'Experiments for adoption next'
]
        },
        {
            title: 'Metrics storyboard',
            theme: 'metrics',
            prompts: [
        'Describe how metrics shows up for the product today.',
        'List the voices who can elevate metrics right now.',
        'Capture one bold experiment connected to metrics.',
        'Note signals that confirm metrics is thriving.',
        'Document risks that could erode metrics if ignored.',
        'Imagine how metrics feels when everything clicks.',
        'Outline partnerships that reinforce metrics.',
        'Surface questions still open about metrics.',
        'Highlight a customer story that embodies metrics.',
        'Define a tiny action that nourishes metrics today.',
        'Express gratitude related to metrics moments.',
        'Sketch the momentum curve of metrics across the week.'
],
            ideas: [
        'We could celebrate metrics by amplifying origin.',
        'Invite audience to co-create metrics signals.',
        'Prototype a habit that keeps metrics visible.',
        'Audit the workflows touching metrics moments.',
        'Pair up with audience to unstick metrics blockers.',
        'Share a win around metrics with the wider team.',
        'Capture metrics that relate to metrics in the dashboard.',
        'Host a five-minute retro on metrics mid-week.',
        'Create an inspirational mood board for metrics.',
        'Curate a playlist that mirrors the energy of metrics.',
        'Draft a short story describing metrics success.',
        'Identify one constraint to relax around metrics.'
],
            checkpoints: [
        'Confidence in metrics today',
        'Support requested for metrics',
        'Signals to monitor for metrics',
        'Decision pending around metrics',
        'Celebration planned for metrics',
        'Learning captured about metrics',
        'Risk mitigation for metrics',
        'Data sources verifying metrics',
        'Stakeholders cheering metrics',
        'Timeline adjustments affecting metrics',
        'Resources to unlock metrics',
        'Experiments for metrics next'
]
        },
        {
            title: 'Launch whispers',
            theme: 'launch',
            prompts: [
        'Describe how launch shows up for the product today.',
        'List the voices who can elevate launch right now.',
        'Capture one bold experiment connected to launch.',
        'Note signals that confirm launch is thriving.',
        'Document risks that could erode launch if ignored.',
        'Imagine how launch feels when everything clicks.',
        'Outline partnerships that reinforce launch.',
        'Surface questions still open about launch.',
        'Highlight a customer story that embodies launch.',
        'Define a tiny action that nourishes launch today.',
        'Express gratitude related to launch moments.',
        'Sketch the momentum curve of launch across the week.'
],
            ideas: [
        'We could celebrate launch by amplifying audience.',
        'Invite pain to co-create launch signals.',
        'Prototype a habit that keeps launch visible.',
        'Audit the workflows touching launch moments.',
        'Pair up with pain to unstick launch blockers.',
        'Share a win around launch with the wider team.',
        'Capture metrics that relate to launch in the dashboard.',
        'Host a five-minute retro on launch mid-week.',
        'Create an inspirational mood board for launch.',
        'Curate a playlist that mirrors the energy of launch.',
        'Draft a short story describing launch success.',
        'Identify one constraint to relax around launch.'
],
            checkpoints: [
        'Confidence in launch today',
        'Support requested for launch',
        'Signals to monitor for launch',
        'Decision pending around launch',
        'Celebration planned for launch',
        'Learning captured about launch',
        'Risk mitigation for launch',
        'Data sources verifying launch',
        'Stakeholders cheering launch',
        'Timeline adjustments affecting launch',
        'Resources to unlock launch',
        'Experiments for launch next'
]
        }
],
        affirmations: [
        'We protect momentum even when things wobble.',
        'Curiosity fuels every iteration we attempt.',
        'We celebrate micro-wins loudly and often.',
        'Humans first, then process, then tooling.',
        'We learn faster together than alone.',
        'Every obstacle carries a hidden insight.',
        'Joy and rigor can absolutely coexist.',
        'We narrate progress so others feel invited.',
        'Pauses are an intentional productivity move.',
        'We choose clarity over speed when needed.',
        'Listening deeply is our superpower.',
        'We prioritise kindness without losing edge.',
        'Celebration is a strategy, not an afterthought.',
        'Asking better questions unlocks better answers.',
        'We leave room for surprise and delight.',
        'Tiny experiments accumulate into bold impact.',
        'Documenting context keeps the future grateful.',
        'We signal progress with warmth and precision.',
        'Reflection is the bridge between today and tomorrow.',
        'We craft experiences that feel like a conversation.',
        'We choose origin storyline',
        'We choose origin highlight',
        'We choose origin question',
        'We choose origin invitation',
        'We choose origin experiment',
        'We choose audience storyline',
        'We choose audience highlight',
        'We choose audience question',
        'We choose audience invitation',
        'We choose audience experiment',
        'We choose pain storyline',
        'We choose pain highlight',
        'We choose pain question',
        'We choose pain invitation',
        'We choose pain experiment',
        'We choose promise storyline',
        'We choose promise highlight',
        'We choose promise question',
        'We choose promise invitation',
        'We choose promise experiment',
        'We choose edge storyline',
        'We choose edge highlight',
        'We choose edge question',
        'We choose edge invitation',
        'We choose edge experiment',
        'We choose adoption storyline',
        'We choose adoption highlight',
        'We choose adoption question',
        'We choose adoption invitation',
        'We choose adoption experiment',
        'We choose metrics storyline',
        'We choose metrics highlight',
        'We choose metrics question',
        'We choose metrics invitation',
        'We choose metrics experiment',
        'We choose launch storyline',
        'We choose launch highlight',
        'We choose launch question',
        'We choose launch invitation',
        'We choose launch experiment'
],
        defaultConfig: {
    title: 'Product briefing companion',
    tone: 'narrative',
    sections: 'Origin story,Audience snapshot,Pain-point mural,Promise statement',
    includeReflection: true,
    customHighlights: ''
},
        form: [
        {
            key: 'title',
            label: 'Template title',
            type: 'text',
            placeholder: 'Product briefing companion'
        },
        {
            key: 'tone',
            label: 'Tone',
            type: 'select',
            options: [
        {
            value: 'narrative',
            label: 'Narrative'
        },
        {
            value: 'confident',
            label: 'Confident'
        },
        {
            value: 'empathetic',
            label: 'Empathetic'
        },
        {
            value: 'visionary',
            label: 'Visionary'
        },
        {
            value: 'playful',
            label: 'Playful'
        }
]
        },
        {
            key: 'sections',
            label: 'Sections to include',
            type: 'textarea',
            rows: 3,
            placeholder: 'Origin story,Audience snapshot,Pain-point mural,Promise statement'
        },
        {
            key: 'includeReflection',
            label: 'Add reflection prompts',
            type: 'checkbox'
        },
        {
            key: 'customHighlights',
            label: 'Custom highlights',
            type: 'textarea',
            rows: 3,
            placeholder: 'Wins to celebrate'
        }
]
    },
    {
        id: 'extended-trigger-standup-template',
        category: 'trigger',
        name: 'Stand-up flow maker',
        description: 'Create a stand-up guide emphasising storytelling, blockers, and gratitude.',
        icon: 'mic',
        accent: '#f97316',
        tags: [
        'template',
        'team',
        'communication',
        'trigger'
],
        mode: 'template',
        topic: 'the stand-up',
        tones: [
        'concise',
        'celebratory',
        'realistic',
        'curious',
        'calm'
],
        sections: [
        {
            title: 'Yesterday\'s storyline',
            theme: 'story',
            prompts: [
        'Describe how story shows up for the stand-up today.',
        'List the voices who can elevate story right now.',
        'Capture one bold experiment connected to story.',
        'Note signals that confirm story is thriving.',
        'Document risks that could erode story if ignored.',
        'Imagine how story feels when everything clicks.',
        'Outline partnerships that reinforce story.',
        'Surface questions still open about story.',
        'Highlight a customer story that embodies story.',
        'Define a tiny action that nourishes story today.',
        'Express gratitude related to story moments.',
        'Sketch the momentum curve of story across the week.'
],
            ideas: [
        'We could celebrate story by amplifying signal.',
        'Invite support to co-create story signals.',
        'Prototype a habit that keeps story visible.',
        'Audit the workflows touching story moments.',
        'Pair up with support to unstick story blockers.',
        'Share a win around story with the wider team.',
        'Capture metrics that relate to story in the dashboard.',
        'Host a five-minute retro on story mid-week.',
        'Create an inspirational mood board for story.',
        'Curate a playlist that mirrors the energy of story.',
        'Draft a short story describing story success.',
        'Identify one constraint to relax around story.'
],
            checkpoints: [
        'Confidence in story today',
        'Support requested for story',
        'Signals to monitor for story',
        'Decision pending around story',
        'Celebration planned for story',
        'Learning captured about story',
        'Risk mitigation for story',
        'Data sources verifying story',
        'Stakeholders cheering story',
        'Timeline adjustments affecting story',
        'Resources to unlock story',
        'Experiments for story next'
]
        },
        {
            title: 'Today\'s commitment',
            theme: 'commitment',
            prompts: [
        'Describe how commitment shows up for the stand-up today.',
        'List the voices who can elevate commitment right now.',
        'Capture one bold experiment connected to commitment.',
        'Note signals that confirm commitment is thriving.',
        'Document risks that could erode commitment if ignored.',
        'Imagine how commitment feels when everything clicks.',
        'Outline partnerships that reinforce commitment.',
        'Surface questions still open about commitment.',
        'Highlight a customer story that embodies commitment.',
        'Define a tiny action that nourishes commitment today.',
        'Express gratitude related to commitment moments.',
        'Sketch the momentum curve of commitment across the week.'
],
            ideas: [
        'We could celebrate commitment by amplifying support.',
        'Invite gratitude to co-create commitment signals.',
        'Prototype a habit that keeps commitment visible.',
        'Audit the workflows touching commitment moments.',
        'Pair up with gratitude to unstick commitment blockers.',
        'Share a win around commitment with the wider team.',
        'Capture metrics that relate to commitment in the dashboard.',
        'Host a five-minute retro on commitment mid-week.',
        'Create an inspirational mood board for commitment.',
        'Curate a playlist that mirrors the energy of commitment.',
        'Draft a short story describing commitment success.',
        'Identify one constraint to relax around commitment.'
],
            checkpoints: [
        'Confidence in commitment today',
        'Support requested for commitment',
        'Signals to monitor for commitment',
        'Decision pending around commitment',
        'Celebration planned for commitment',
        'Learning captured about commitment',
        'Risk mitigation for commitment',
        'Data sources verifying commitment',
        'Stakeholders cheering commitment',
        'Timeline adjustments affecting commitment',
        'Resources to unlock commitment',
        'Experiments for commitment next'
]
        },
        {
            title: 'Signals to watch',
            theme: 'signal',
            prompts: [
        'Describe how signal shows up for the stand-up today.',
        'List the voices who can elevate signal right now.',
        'Capture one bold experiment connected to signal.',
        'Note signals that confirm signal is thriving.',
        'Document risks that could erode signal if ignored.',
        'Imagine how signal feels when everything clicks.',
        'Outline partnerships that reinforce signal.',
        'Surface questions still open about signal.',
        'Highlight a customer story that embodies signal.',
        'Define a tiny action that nourishes signal today.',
        'Express gratitude related to signal moments.',
        'Sketch the momentum curve of signal across the week.'
],
            ideas: [
        'We could celebrate signal by amplifying gratitude.',
        'Invite energy to co-create signal signals.',
        'Prototype a habit that keeps signal visible.',
        'Audit the workflows touching signal moments.',
        'Pair up with energy to unstick signal blockers.',
        'Share a win around signal with the wider team.',
        'Capture metrics that relate to signal in the dashboard.',
        'Host a five-minute retro on signal mid-week.',
        'Create an inspirational mood board for signal.',
        'Curate a playlist that mirrors the energy of signal.',
        'Draft a short story describing signal success.',
        'Identify one constraint to relax around signal.'
],
            checkpoints: [
        'Confidence in signal today',
        'Support requested for signal',
        'Signals to monitor for signal',
        'Decision pending around signal',
        'Celebration planned for signal',
        'Learning captured about signal',
        'Risk mitigation for signal',
        'Data sources verifying signal',
        'Stakeholders cheering signal',
        'Timeline adjustments affecting signal',
        'Resources to unlock signal',
        'Experiments for signal next'
]
        },
        {
            title: 'Asks & support',
            theme: 'support',
            prompts: [
        'Describe how support shows up for the stand-up today.',
        'List the voices who can elevate support right now.',
        'Capture one bold experiment connected to support.',
        'Note signals that confirm support is thriving.',
        'Document risks that could erode support if ignored.',
        'Imagine how support feels when everything clicks.',
        'Outline partnerships that reinforce support.',
        'Surface questions still open about support.',
        'Highlight a customer story that embodies support.',
        'Define a tiny action that nourishes support today.',
        'Express gratitude related to support moments.',
        'Sketch the momentum curve of support across the week.'
],
            ideas: [
        'We could celebrate support by amplifying energy.',
        'Invite learning to co-create support signals.',
        'Prototype a habit that keeps support visible.',
        'Audit the workflows touching support moments.',
        'Pair up with learning to unstick support blockers.',
        'Share a win around support with the wider team.',
        'Capture metrics that relate to support in the dashboard.',
        'Host a five-minute retro on support mid-week.',
        'Create an inspirational mood board for support.',
        'Curate a playlist that mirrors the energy of support.',
        'Draft a short story describing support success.',
        'Identify one constraint to relax around support.'
],
            checkpoints: [
        'Confidence in support today',
        'Support requested for support',
        'Signals to monitor for support',
        'Decision pending around support',
        'Celebration planned for support',
        'Learning captured about support',
        'Risk mitigation for support',
        'Data sources verifying support',
        'Stakeholders cheering support',
        'Timeline adjustments affecting support',
        'Resources to unlock support',
        'Experiments for support next'
]
        },
        {
            title: 'Appreciations',
            theme: 'gratitude',
            prompts: [
        'Describe how gratitude shows up for the stand-up today.',
        'List the voices who can elevate gratitude right now.',
        'Capture one bold experiment connected to gratitude.',
        'Note signals that confirm gratitude is thriving.',
        'Document risks that could erode gratitude if ignored.',
        'Imagine how gratitude feels when everything clicks.',
        'Outline partnerships that reinforce gratitude.',
        'Surface questions still open about gratitude.',
        'Highlight a customer story that embodies gratitude.',
        'Define a tiny action that nourishes gratitude today.',
        'Express gratitude related to gratitude moments.',
        'Sketch the momentum curve of gratitude across the week.'
],
            ideas: [
        'We could celebrate gratitude by amplifying learning.',
        'Invite help to co-create gratitude signals.',
        'Prototype a habit that keeps gratitude visible.',
        'Audit the workflows touching gratitude moments.',
        'Pair up with help to unstick gratitude blockers.',
        'Share a win around gratitude with the wider team.',
        'Capture metrics that relate to gratitude in the dashboard.',
        'Host a five-minute retro on gratitude mid-week.',
        'Create an inspirational mood board for gratitude.',
        'Curate a playlist that mirrors the energy of gratitude.',
        'Draft a short story describing gratitude success.',
        'Identify one constraint to relax around gratitude.'
],
            checkpoints: [
        'Confidence in gratitude today',
        'Support requested for gratitude',
        'Signals to monitor for gratitude',
        'Decision pending around gratitude',
        'Celebration planned for gratitude',
        'Learning captured about gratitude',
        'Risk mitigation for gratitude',
        'Data sources verifying gratitude',
        'Stakeholders cheering gratitude',
        'Timeline adjustments affecting gratitude',
        'Resources to unlock gratitude',
        'Experiments for gratitude next'
]
        },
        {
            title: 'Energy check',
            theme: 'energy',
            prompts: [
        'Describe how energy shows up for the stand-up today.',
        'List the voices who can elevate energy right now.',
        'Capture one bold experiment connected to energy.',
        'Note signals that confirm energy is thriving.',
        'Document risks that could erode energy if ignored.',
        'Imagine how energy feels when everything clicks.',
        'Outline partnerships that reinforce energy.',
        'Surface questions still open about energy.',
        'Highlight a customer story that embodies energy.',
        'Define a tiny action that nourishes energy today.',
        'Express gratitude related to energy moments.',
        'Sketch the momentum curve of energy across the week.'
],
            ideas: [
        'We could celebrate energy by amplifying help.',
        'Invite story to co-create energy signals.',
        'Prototype a habit that keeps energy visible.',
        'Audit the workflows touching energy moments.',
        'Pair up with story to unstick energy blockers.',
        'Share a win around energy with the wider team.',
        'Capture metrics that relate to energy in the dashboard.',
        'Host a five-minute retro on energy mid-week.',
        'Create an inspirational mood board for energy.',
        'Curate a playlist that mirrors the energy of energy.',
        'Draft a short story describing energy success.',
        'Identify one constraint to relax around energy.'
],
            checkpoints: [
        'Confidence in energy today',
        'Support requested for energy',
        'Signals to monitor for energy',
        'Decision pending around energy',
        'Celebration planned for energy',
        'Learning captured about energy',
        'Risk mitigation for energy',
        'Data sources verifying energy',
        'Stakeholders cheering energy',
        'Timeline adjustments affecting energy',
        'Resources to unlock energy',
        'Experiments for energy next'
]
        },
        {
            title: 'Learning sparks',
            theme: 'learning',
            prompts: [
        'Describe how learning shows up for the stand-up today.',
        'List the voices who can elevate learning right now.',
        'Capture one bold experiment connected to learning.',
        'Note signals that confirm learning is thriving.',
        'Document risks that could erode learning if ignored.',
        'Imagine how learning feels when everything clicks.',
        'Outline partnerships that reinforce learning.',
        'Surface questions still open about learning.',
        'Highlight a customer story that embodies learning.',
        'Define a tiny action that nourishes learning today.',
        'Express gratitude related to learning moments.',
        'Sketch the momentum curve of learning across the week.'
],
            ideas: [
        'We could celebrate learning by amplifying story.',
        'Invite commitment to co-create learning signals.',
        'Prototype a habit that keeps learning visible.',
        'Audit the workflows touching learning moments.',
        'Pair up with commitment to unstick learning blockers.',
        'Share a win around learning with the wider team.',
        'Capture metrics that relate to learning in the dashboard.',
        'Host a five-minute retro on learning mid-week.',
        'Create an inspirational mood board for learning.',
        'Curate a playlist that mirrors the energy of learning.',
        'Draft a short story describing learning success.',
        'Identify one constraint to relax around learning.'
],
            checkpoints: [
        'Confidence in learning today',
        'Support requested for learning',
        'Signals to monitor for learning',
        'Decision pending around learning',
        'Celebration planned for learning',
        'Learning captured about learning',
        'Risk mitigation for learning',
        'Data sources verifying learning',
        'Stakeholders cheering learning',
        'Timeline adjustments affecting learning',
        'Resources to unlock learning',
        'Experiments for learning next'
]
        },
        {
            title: 'Shout for help',
            theme: 'help',
            prompts: [
        'Describe how help shows up for the stand-up today.',
        'List the voices who can elevate help right now.',
        'Capture one bold experiment connected to help.',
        'Note signals that confirm help is thriving.',
        'Document risks that could erode help if ignored.',
        'Imagine how help feels when everything clicks.',
        'Outline partnerships that reinforce help.',
        'Surface questions still open about help.',
        'Highlight a customer story that embodies help.',
        'Define a tiny action that nourishes help today.',
        'Express gratitude related to help moments.',
        'Sketch the momentum curve of help across the week.'
],
            ideas: [
        'We could celebrate help by amplifying commitment.',
        'Invite signal to co-create help signals.',
        'Prototype a habit that keeps help visible.',
        'Audit the workflows touching help moments.',
        'Pair up with signal to unstick help blockers.',
        'Share a win around help with the wider team.',
        'Capture metrics that relate to help in the dashboard.',
        'Host a five-minute retro on help mid-week.',
        'Create an inspirational mood board for help.',
        'Curate a playlist that mirrors the energy of help.',
        'Draft a short story describing help success.',
        'Identify one constraint to relax around help.'
],
            checkpoints: [
        'Confidence in help today',
        'Support requested for help',
        'Signals to monitor for help',
        'Decision pending around help',
        'Celebration planned for help',
        'Learning captured about help',
        'Risk mitigation for help',
        'Data sources verifying help',
        'Stakeholders cheering help',
        'Timeline adjustments affecting help',
        'Resources to unlock help',
        'Experiments for help next'
]
        }
],
        affirmations: [
        'We protect momentum even when things wobble.',
        'Curiosity fuels every iteration we attempt.',
        'We celebrate micro-wins loudly and often.',
        'Humans first, then process, then tooling.',
        'We learn faster together than alone.',
        'Every obstacle carries a hidden insight.',
        'Joy and rigor can absolutely coexist.',
        'We narrate progress so others feel invited.',
        'Pauses are an intentional productivity move.',
        'We choose clarity over speed when needed.',
        'Listening deeply is our superpower.',
        'We prioritise kindness without losing edge.',
        'Celebration is a strategy, not an afterthought.',
        'Asking better questions unlocks better answers.',
        'We leave room for surprise and delight.',
        'Tiny experiments accumulate into bold impact.',
        'Documenting context keeps the future grateful.',
        'We signal progress with warmth and precision.',
        'Reflection is the bridge between today and tomorrow.',
        'We craft experiences that feel like a conversation.',
        'We choose story storyline',
        'We choose story highlight',
        'We choose story question',
        'We choose story invitation',
        'We choose story experiment',
        'We choose commitment storyline',
        'We choose commitment highlight',
        'We choose commitment question',
        'We choose commitment invitation',
        'We choose commitment experiment',
        'We choose signal storyline',
        'We choose signal highlight',
        'We choose signal question',
        'We choose signal invitation',
        'We choose signal experiment',
        'We choose support storyline',
        'We choose support highlight',
        'We choose support question',
        'We choose support invitation',
        'We choose support experiment',
        'We choose gratitude storyline',
        'We choose gratitude highlight',
        'We choose gratitude question',
        'We choose gratitude invitation',
        'We choose gratitude experiment',
        'We choose energy storyline',
        'We choose energy highlight',
        'We choose energy question',
        'We choose energy invitation',
        'We choose energy experiment',
        'We choose learning storyline',
        'We choose learning highlight',
        'We choose learning question',
        'We choose learning invitation',
        'We choose learning experiment',
        'We choose help storyline',
        'We choose help highlight',
        'We choose help question',
        'We choose help invitation',
        'We choose help experiment'
],
        defaultConfig: {
    title: 'Stand-up flow maker',
    tone: 'concise',
    sections: 'Yesterday\'s storyline,Today\'s commitment,Signals to watch,Asks & support',
    includeReflection: true,
    customHighlights: ''
},
        form: [
        {
            key: 'title',
            label: 'Template title',
            type: 'text',
            placeholder: 'Stand-up flow maker'
        },
        {
            key: 'tone',
            label: 'Tone',
            type: 'select',
            options: [
        {
            value: 'concise',
            label: 'Concise'
        },
        {
            value: 'celebratory',
            label: 'Celebratory'
        },
        {
            value: 'realistic',
            label: 'Realistic'
        },
        {
            value: 'curious',
            label: 'Curious'
        },
        {
            value: 'calm',
            label: 'Calm'
        }
]
        },
        {
            key: 'sections',
            label: 'Sections to include',
            type: 'textarea',
            rows: 3,
            placeholder: 'Yesterday\'s storyline,Today\'s commitment,Signals to watch,Asks & support'
        },
        {
            key: 'includeReflection',
            label: 'Add reflection prompts',
            type: 'checkbox'
        },
        {
            key: 'customHighlights',
            label: 'Custom highlights',
            type: 'textarea',
            rows: 3,
            placeholder: 'Wins to celebrate'
        }
]
    },
    {
        id: 'extended-trigger-release-checklist',
        category: 'trigger',
        name: 'Release readiness scorecard',
        description: 'Ensure a release is grounded with checks, confidence notes, and rollback cues.',
        icon: 'check-square',
        accent: '#16a34a',
        tags: [
        'template',
        'delivery',
        'quality',
        'trigger'
],
        mode: 'template',
        topic: 'the release',
        tones: [
        'reassuring',
        'diligent',
        'cautious',
        'optimistic',
        'thorough'
],
        sections: [
        {
            title: 'Launch criteria',
            theme: 'criteria',
            prompts: [
        'Describe how criteria shows up for the release today.',
        'List the voices who can elevate criteria right now.',
        'Capture one bold experiment connected to criteria.',
        'Note signals that confirm criteria is thriving.',
        'Document risks that could erode criteria if ignored.',
        'Imagine how criteria feels when everything clicks.',
        'Outline partnerships that reinforce criteria.',
        'Surface questions still open about criteria.',
        'Highlight a customer story that embodies criteria.',
        'Define a tiny action that nourishes criteria today.',
        'Express gratitude related to criteria moments.',
        'Sketch the momentum curve of criteria across the week.'
],
            ideas: [
        'We could celebrate criteria by amplifying risk.',
        'Invite communication to co-create criteria signals.',
        'Prototype a habit that keeps criteria visible.',
        'Audit the workflows touching criteria moments.',
        'Pair up with communication to unstick criteria blockers.',
        'Share a win around criteria with the wider team.',
        'Capture metrics that relate to criteria in the dashboard.',
        'Host a five-minute retro on criteria mid-week.',
        'Create an inspirational mood board for criteria.',
        'Curate a playlist that mirrors the energy of criteria.',
        'Draft a short story describing criteria success.',
        'Identify one constraint to relax around criteria.'
],
            checkpoints: [
        'Confidence in criteria today',
        'Support requested for criteria',
        'Signals to monitor for criteria',
        'Decision pending around criteria',
        'Celebration planned for criteria',
        'Learning captured about criteria',
        'Risk mitigation for criteria',
        'Data sources verifying criteria',
        'Stakeholders cheering criteria',
        'Timeline adjustments affecting criteria',
        'Resources to unlock criteria',
        'Experiments for criteria next'
]
        },
        {
            title: 'Quality signals',
            theme: 'quality',
            prompts: [
        'Describe how quality shows up for the release today.',
        'List the voices who can elevate quality right now.',
        'Capture one bold experiment connected to quality.',
        'Note signals that confirm quality is thriving.',
        'Document risks that could erode quality if ignored.',
        'Imagine how quality feels when everything clicks.',
        'Outline partnerships that reinforce quality.',
        'Surface questions still open about quality.',
        'Highlight a customer story that embodies quality.',
        'Define a tiny action that nourishes quality today.',
        'Express gratitude related to quality moments.',
        'Sketch the momentum curve of quality across the week.'
],
            ideas: [
        'We could celebrate quality by amplifying communication.',
        'Invite support to co-create quality signals.',
        'Prototype a habit that keeps quality visible.',
        'Audit the workflows touching quality moments.',
        'Pair up with support to unstick quality blockers.',
        'Share a win around quality with the wider team.',
        'Capture metrics that relate to quality in the dashboard.',
        'Host a five-minute retro on quality mid-week.',
        'Create an inspirational mood board for quality.',
        'Curate a playlist that mirrors the energy of quality.',
        'Draft a short story describing quality success.',
        'Identify one constraint to relax around quality.'
],
            checkpoints: [
        'Confidence in quality today',
        'Support requested for quality',
        'Signals to monitor for quality',
        'Decision pending around quality',
        'Celebration planned for quality',
        'Learning captured about quality',
        'Risk mitigation for quality',
        'Data sources verifying quality',
        'Stakeholders cheering quality',
        'Timeline adjustments affecting quality',
        'Resources to unlock quality',
        'Experiments for quality next'
]
        },
        {
            title: 'Risk hedges',
            theme: 'risk',
            prompts: [
        'Describe how risk shows up for the release today.',
        'List the voices who can elevate risk right now.',
        'Capture one bold experiment connected to risk.',
        'Note signals that confirm risk is thriving.',
        'Document risks that could erode risk if ignored.',
        'Imagine how risk feels when everything clicks.',
        'Outline partnerships that reinforce risk.',
        'Surface questions still open about risk.',
        'Highlight a customer story that embodies risk.',
        'Define a tiny action that nourishes risk today.',
        'Express gratitude related to risk moments.',
        'Sketch the momentum curve of risk across the week.'
],
            ideas: [
        'We could celebrate risk by amplifying support.',
        'Invite analytics to co-create risk signals.',
        'Prototype a habit that keeps risk visible.',
        'Audit the workflows touching risk moments.',
        'Pair up with analytics to unstick risk blockers.',
        'Share a win around risk with the wider team.',
        'Capture metrics that relate to risk in the dashboard.',
        'Host a five-minute retro on risk mid-week.',
        'Create an inspirational mood board for risk.',
        'Curate a playlist that mirrors the energy of risk.',
        'Draft a short story describing risk success.',
        'Identify one constraint to relax around risk.'
],
            checkpoints: [
        'Confidence in risk today',
        'Support requested for risk',
        'Signals to monitor for risk',
        'Decision pending around risk',
        'Celebration planned for risk',
        'Learning captured about risk',
        'Risk mitigation for risk',
        'Data sources verifying risk',
        'Stakeholders cheering risk',
        'Timeline adjustments affecting risk',
        'Resources to unlock risk',
        'Experiments for risk next'
]
        },
        {
            title: 'Communication plan',
            theme: 'communication',
            prompts: [
        'Describe how communication shows up for the release today.',
        'List the voices who can elevate communication right now.',
        'Capture one bold experiment connected to communication.',
        'Note signals that confirm communication is thriving.',
        'Document risks that could erode communication if ignored.',
        'Imagine how communication feels when everything clicks.',
        'Outline partnerships that reinforce communication.',
        'Surface questions still open about communication.',
        'Highlight a customer story that embodies communication.',
        'Define a tiny action that nourishes communication today.',
        'Express gratitude related to communication moments.',
        'Sketch the momentum curve of communication across the week.'
],
            ideas: [
        'We could celebrate communication by amplifying analytics.',
        'Invite rollback to co-create communication signals.',
        'Prototype a habit that keeps communication visible.',
        'Audit the workflows touching communication moments.',
        'Pair up with rollback to unstick communication blockers.',
        'Share a win around communication with the wider team.',
        'Capture metrics that relate to communication in the dashboard.',
        'Host a five-minute retro on communication mid-week.',
        'Create an inspirational mood board for communication.',
        'Curate a playlist that mirrors the energy of communication.',
        'Draft a short story describing communication success.',
        'Identify one constraint to relax around communication.'
],
            checkpoints: [
        'Confidence in communication today',
        'Support requested for communication',
        'Signals to monitor for communication',
        'Decision pending around communication',
        'Celebration planned for communication',
        'Learning captured about communication',
        'Risk mitigation for communication',
        'Data sources verifying communication',
        'Stakeholders cheering communication',
        'Timeline adjustments affecting communication',
        'Resources to unlock communication',
        'Experiments for communication next'
]
        },
        {
            title: 'Support readiness',
            theme: 'support',
            prompts: [
        'Describe how support shows up for the release today.',
        'List the voices who can elevate support right now.',
        'Capture one bold experiment connected to support.',
        'Note signals that confirm support is thriving.',
        'Document risks that could erode support if ignored.',
        'Imagine how support feels when everything clicks.',
        'Outline partnerships that reinforce support.',
        'Surface questions still open about support.',
        'Highlight a customer story that embodies support.',
        'Define a tiny action that nourishes support today.',
        'Express gratitude related to support moments.',
        'Sketch the momentum curve of support across the week.'
],
            ideas: [
        'We could celebrate support by amplifying rollback.',
        'Invite celebration to co-create support signals.',
        'Prototype a habit that keeps support visible.',
        'Audit the workflows touching support moments.',
        'Pair up with celebration to unstick support blockers.',
        'Share a win around support with the wider team.',
        'Capture metrics that relate to support in the dashboard.',
        'Host a five-minute retro on support mid-week.',
        'Create an inspirational mood board for support.',
        'Curate a playlist that mirrors the energy of support.',
        'Draft a short story describing support success.',
        'Identify one constraint to relax around support.'
],
            checkpoints: [
        'Confidence in support today',
        'Support requested for support',
        'Signals to monitor for support',
        'Decision pending around support',
        'Celebration planned for support',
        'Learning captured about support',
        'Risk mitigation for support',
        'Data sources verifying support',
        'Stakeholders cheering support',
        'Timeline adjustments affecting support',
        'Resources to unlock support',
        'Experiments for support next'
]
        },
        {
            title: 'Analytics hooks',
            theme: 'analytics',
            prompts: [
        'Describe how analytics shows up for the release today.',
        'List the voices who can elevate analytics right now.',
        'Capture one bold experiment connected to analytics.',
        'Note signals that confirm analytics is thriving.',
        'Document risks that could erode analytics if ignored.',
        'Imagine how analytics feels when everything clicks.',
        'Outline partnerships that reinforce analytics.',
        'Surface questions still open about analytics.',
        'Highlight a customer story that embodies analytics.',
        'Define a tiny action that nourishes analytics today.',
        'Express gratitude related to analytics moments.',
        'Sketch the momentum curve of analytics across the week.'
],
            ideas: [
        'We could celebrate analytics by amplifying celebration.',
        'Invite criteria to co-create analytics signals.',
        'Prototype a habit that keeps analytics visible.',
        'Audit the workflows touching analytics moments.',
        'Pair up with criteria to unstick analytics blockers.',
        'Share a win around analytics with the wider team.',
        'Capture metrics that relate to analytics in the dashboard.',
        'Host a five-minute retro on analytics mid-week.',
        'Create an inspirational mood board for analytics.',
        'Curate a playlist that mirrors the energy of analytics.',
        'Draft a short story describing analytics success.',
        'Identify one constraint to relax around analytics.'
],
            checkpoints: [
        'Confidence in analytics today',
        'Support requested for analytics',
        'Signals to monitor for analytics',
        'Decision pending around analytics',
        'Celebration planned for analytics',
        'Learning captured about analytics',
        'Risk mitigation for analytics',
        'Data sources verifying analytics',
        'Stakeholders cheering analytics',
        'Timeline adjustments affecting analytics',
        'Resources to unlock analytics',
        'Experiments for analytics next'
]
        },
        {
            title: 'Rollback script',
            theme: 'rollback',
            prompts: [
        'Describe how rollback shows up for the release today.',
        'List the voices who can elevate rollback right now.',
        'Capture one bold experiment connected to rollback.',
        'Note signals that confirm rollback is thriving.',
        'Document risks that could erode rollback if ignored.',
        'Imagine how rollback feels when everything clicks.',
        'Outline partnerships that reinforce rollback.',
        'Surface questions still open about rollback.',
        'Highlight a customer story that embodies rollback.',
        'Define a tiny action that nourishes rollback today.',
        'Express gratitude related to rollback moments.',
        'Sketch the momentum curve of rollback across the week.'
],
            ideas: [
        'We could celebrate rollback by amplifying criteria.',
        'Invite quality to co-create rollback signals.',
        'Prototype a habit that keeps rollback visible.',
        'Audit the workflows touching rollback moments.',
        'Pair up with quality to unstick rollback blockers.',
        'Share a win around rollback with the wider team.',
        'Capture metrics that relate to rollback in the dashboard.',
        'Host a five-minute retro on rollback mid-week.',
        'Create an inspirational mood board for rollback.',
        'Curate a playlist that mirrors the energy of rollback.',
        'Draft a short story describing rollback success.',
        'Identify one constraint to relax around rollback.'
],
            checkpoints: [
        'Confidence in rollback today',
        'Support requested for rollback',
        'Signals to monitor for rollback',
        'Decision pending around rollback',
        'Celebration planned for rollback',
        'Learning captured about rollback',
        'Risk mitigation for rollback',
        'Data sources verifying rollback',
        'Stakeholders cheering rollback',
        'Timeline adjustments affecting rollback',
        'Resources to unlock rollback',
        'Experiments for rollback next'
]
        },
        {
            title: 'Celebration plan',
            theme: 'celebration',
            prompts: [
        'Describe how celebration shows up for the release today.',
        'List the voices who can elevate celebration right now.',
        'Capture one bold experiment connected to celebration.',
        'Note signals that confirm celebration is thriving.',
        'Document risks that could erode celebration if ignored.',
        'Imagine how celebration feels when everything clicks.',
        'Outline partnerships that reinforce celebration.',
        'Surface questions still open about celebration.',
        'Highlight a customer story that embodies celebration.',
        'Define a tiny action that nourishes celebration today.',
        'Express gratitude related to celebration moments.',
        'Sketch the momentum curve of celebration across the week.'
],
            ideas: [
        'We could celebrate celebration by amplifying quality.',
        'Invite risk to co-create celebration signals.',
        'Prototype a habit that keeps celebration visible.',
        'Audit the workflows touching celebration moments.',
        'Pair up with risk to unstick celebration blockers.',
        'Share a win around celebration with the wider team.',
        'Capture metrics that relate to celebration in the dashboard.',
        'Host a five-minute retro on celebration mid-week.',
        'Create an inspirational mood board for celebration.',
        'Curate a playlist that mirrors the energy of celebration.',
        'Draft a short story describing celebration success.',
        'Identify one constraint to relax around celebration.'
],
            checkpoints: [
        'Confidence in celebration today',
        'Support requested for celebration',
        'Signals to monitor for celebration',
        'Decision pending around celebration',
        'Celebration planned for celebration',
        'Learning captured about celebration',
        'Risk mitigation for celebration',
        'Data sources verifying celebration',
        'Stakeholders cheering celebration',
        'Timeline adjustments affecting celebration',
        'Resources to unlock celebration',
        'Experiments for celebration next'
]
        }
],
        affirmations: [
        'We protect momentum even when things wobble.',
        'Curiosity fuels every iteration we attempt.',
        'We celebrate micro-wins loudly and often.',
        'Humans first, then process, then tooling.',
        'We learn faster together than alone.',
        'Every obstacle carries a hidden insight.',
        'Joy and rigor can absolutely coexist.',
        'We narrate progress so others feel invited.',
        'Pauses are an intentional productivity move.',
        'We choose clarity over speed when needed.',
        'Listening deeply is our superpower.',
        'We prioritise kindness without losing edge.',
        'Celebration is a strategy, not an afterthought.',
        'Asking better questions unlocks better answers.',
        'We leave room for surprise and delight.',
        'Tiny experiments accumulate into bold impact.',
        'Documenting context keeps the future grateful.',
        'We signal progress with warmth and precision.',
        'Reflection is the bridge between today and tomorrow.',
        'We craft experiences that feel like a conversation.',
        'We choose criteria storyline',
        'We choose criteria highlight',
        'We choose criteria question',
        'We choose criteria invitation',
        'We choose criteria experiment',
        'We choose quality storyline',
        'We choose quality highlight',
        'We choose quality question',
        'We choose quality invitation',
        'We choose quality experiment',
        'We choose risk storyline',
        'We choose risk highlight',
        'We choose risk question',
        'We choose risk invitation',
        'We choose risk experiment',
        'We choose communication storyline',
        'We choose communication highlight',
        'We choose communication question',
        'We choose communication invitation',
        'We choose communication experiment',
        'We choose support storyline',
        'We choose support highlight',
        'We choose support question',
        'We choose support invitation',
        'We choose support experiment',
        'We choose analytics storyline',
        'We choose analytics highlight',
        'We choose analytics question',
        'We choose analytics invitation',
        'We choose analytics experiment',
        'We choose rollback storyline',
        'We choose rollback highlight',
        'We choose rollback question',
        'We choose rollback invitation',
        'We choose rollback experiment',
        'We choose celebration storyline',
        'We choose celebration highlight',
        'We choose celebration question',
        'We choose celebration invitation',
        'We choose celebration experiment'
],
        defaultConfig: {
    title: 'Release readiness scorecard',
    tone: 'reassuring',
    sections: 'Launch criteria,Quality signals,Risk hedges,Communication plan',
    includeReflection: true,
    customHighlights: ''
},
        form: [
        {
            key: 'title',
            label: 'Template title',
            type: 'text',
            placeholder: 'Release readiness scorecard'
        },
        {
            key: 'tone',
            label: 'Tone',
            type: 'select',
            options: [
        {
            value: 'reassuring',
            label: 'Reassuring'
        },
        {
            value: 'diligent',
            label: 'Diligent'
        },
        {
            value: 'cautious',
            label: 'Cautious'
        },
        {
            value: 'optimistic',
            label: 'Optimistic'
        },
        {
            value: 'thorough',
            label: 'Thorough'
        }
]
        },
        {
            key: 'sections',
            label: 'Sections to include',
            type: 'textarea',
            rows: 3,
            placeholder: 'Launch criteria,Quality signals,Risk hedges,Communication plan'
        },
        {
            key: 'includeReflection',
            label: 'Add reflection prompts',
            type: 'checkbox'
        },
        {
            key: 'customHighlights',
            label: 'Custom highlights',
            type: 'textarea',
            rows: 3,
            placeholder: 'Wins to celebrate'
        }
]
    },
    {
        id: 'extended-trigger-bug-report',
        category: 'trigger',
        name: 'Bug report storyteller',
        description: 'Capture bug stories with user context, reproduction path, and debug intentions.',
        icon: 'alert-triangle',
        accent: '#ef4444',
        tags: [
        'template',
        'quality',
        'debug',
        'trigger'
],
        mode: 'template',
        topic: 'the bug',
        tones: [
        'precise',
        'empathetic',
        'curious',
        'pragmatic',
        'thorough'
],
        sections: [
        {
            title: 'User journey',
            theme: 'journey',
            prompts: [
        'Describe how journey shows up for the bug today.',
        'List the voices who can elevate journey right now.',
        'Capture one bold experiment connected to journey.',
        'Note signals that confirm journey is thriving.',
        'Document risks that could erode journey if ignored.',
        'Imagine how journey feels when everything clicks.',
        'Outline partnerships that reinforce journey.',
        'Surface questions still open about journey.',
        'Highlight a customer story that embodies journey.',
        'Define a tiny action that nourishes journey today.',
        'Express gratitude related to journey moments.',
        'Sketch the momentum curve of journey across the week.'
],
            ideas: [
        'We could celebrate journey by amplifying trigger.',
        'Invite expectation to co-create journey signals.',
        'Prototype a habit that keeps journey visible.',
        'Audit the workflows touching journey moments.',
        'Pair up with expectation to unstick journey blockers.',
        'Share a win around journey with the wider team.',
        'Capture metrics that relate to journey in the dashboard.',
        'Host a five-minute retro on journey mid-week.',
        'Create an inspirational mood board for journey.',
        'Curate a playlist that mirrors the energy of journey.',
        'Draft a short story describing journey success.',
        'Identify one constraint to relax around journey.'
],
            checkpoints: [
        'Confidence in journey today',
        'Support requested for journey',
        'Signals to monitor for journey',
        'Decision pending around journey',
        'Celebration planned for journey',
        'Learning captured about journey',
        'Risk mitigation for journey',
        'Data sources verifying journey',
        'Stakeholders cheering journey',
        'Timeline adjustments affecting journey',
        'Resources to unlock journey',
        'Experiments for journey next'
]
        },
        {
            title: 'Environment sketch',
            theme: 'environment',
            prompts: [
        'Describe how environment shows up for the bug today.',
        'List the voices who can elevate environment right now.',
        'Capture one bold experiment connected to environment.',
        'Note signals that confirm environment is thriving.',
        'Document risks that could erode environment if ignored.',
        'Imagine how environment feels when everything clicks.',
        'Outline partnerships that reinforce environment.',
        'Surface questions still open about environment.',
        'Highlight a customer story that embodies environment.',
        'Define a tiny action that nourishes environment today.',
        'Express gratitude related to environment moments.',
        'Sketch the momentum curve of environment across the week.'
],
            ideas: [
        'We could celebrate environment by amplifying expectation.',
        'Invite behaviour to co-create environment signals.',
        'Prototype a habit that keeps environment visible.',
        'Audit the workflows touching environment moments.',
        'Pair up with behaviour to unstick environment blockers.',
        'Share a win around environment with the wider team.',
        'Capture metrics that relate to environment in the dashboard.',
        'Host a five-minute retro on environment mid-week.',
        'Create an inspirational mood board for environment.',
        'Curate a playlist that mirrors the energy of environment.',
        'Draft a short story describing environment success.',
        'Identify one constraint to relax around environment.'
],
            checkpoints: [
        'Confidence in environment today',
        'Support requested for environment',
        'Signals to monitor for environment',
        'Decision pending around environment',
        'Celebration planned for environment',
        'Learning captured about environment',
        'Risk mitigation for environment',
        'Data sources verifying environment',
        'Stakeholders cheering environment',
        'Timeline adjustments affecting environment',
        'Resources to unlock environment',
        'Experiments for environment next'
]
        },
        {
            title: 'Trigger moments',
            theme: 'trigger',
            prompts: [
        'Describe how trigger shows up for the bug today.',
        'List the voices who can elevate trigger right now.',
        'Capture one bold experiment connected to trigger.',
        'Note signals that confirm trigger is thriving.',
        'Document risks that could erode trigger if ignored.',
        'Imagine how trigger feels when everything clicks.',
        'Outline partnerships that reinforce trigger.',
        'Surface questions still open about trigger.',
        'Highlight a customer story that embodies trigger.',
        'Define a tiny action that nourishes trigger today.',
        'Express gratitude related to trigger moments.',
        'Sketch the momentum curve of trigger across the week.'
],
            ideas: [
        'We could celebrate trigger by amplifying behaviour.',
        'Invite steps to co-create trigger signals.',
        'Prototype a habit that keeps trigger visible.',
        'Audit the workflows touching trigger moments.',
        'Pair up with steps to unstick trigger blockers.',
        'Share a win around trigger with the wider team.',
        'Capture metrics that relate to trigger in the dashboard.',
        'Host a five-minute retro on trigger mid-week.',
        'Create an inspirational mood board for trigger.',
        'Curate a playlist that mirrors the energy of trigger.',
        'Draft a short story describing trigger success.',
        'Identify one constraint to relax around trigger.'
],
            checkpoints: [
        'Confidence in trigger today',
        'Support requested for trigger',
        'Signals to monitor for trigger',
        'Decision pending around trigger',
        'Celebration planned for trigger',
        'Learning captured about trigger',
        'Risk mitigation for trigger',
        'Data sources verifying trigger',
        'Stakeholders cheering trigger',
        'Timeline adjustments affecting trigger',
        'Resources to unlock trigger',
        'Experiments for trigger next'
]
        },
        {
            title: 'Expected rhythm',
            theme: 'expectation',
            prompts: [
        'Describe how expectation shows up for the bug today.',
        'List the voices who can elevate expectation right now.',
        'Capture one bold experiment connected to expectation.',
        'Note signals that confirm expectation is thriving.',
        'Document risks that could erode expectation if ignored.',
        'Imagine how expectation feels when everything clicks.',
        'Outline partnerships that reinforce expectation.',
        'Surface questions still open about expectation.',
        'Highlight a customer story that embodies expectation.',
        'Define a tiny action that nourishes expectation today.',
        'Express gratitude related to expectation moments.',
        'Sketch the momentum curve of expectation across the week.'
],
            ideas: [
        'We could celebrate expectation by amplifying steps.',
        'Invite impact to co-create expectation signals.',
        'Prototype a habit that keeps expectation visible.',
        'Audit the workflows touching expectation moments.',
        'Pair up with impact to unstick expectation blockers.',
        'Share a win around expectation with the wider team.',
        'Capture metrics that relate to expectation in the dashboard.',
        'Host a five-minute retro on expectation mid-week.',
        'Create an inspirational mood board for expectation.',
        'Curate a playlist that mirrors the energy of expectation.',
        'Draft a short story describing expectation success.',
        'Identify one constraint to relax around expectation.'
],
            checkpoints: [
        'Confidence in expectation today',
        'Support requested for expectation',
        'Signals to monitor for expectation',
        'Decision pending around expectation',
        'Celebration planned for expectation',
        'Learning captured about expectation',
        'Risk mitigation for expectation',
        'Data sources verifying expectation',
        'Stakeholders cheering expectation',
        'Timeline adjustments affecting expectation',
        'Resources to unlock expectation',
        'Experiments for expectation next'
]
        },
        {
            title: 'Actual behaviour',
            theme: 'behaviour',
            prompts: [
        'Describe how behaviour shows up for the bug today.',
        'List the voices who can elevate behaviour right now.',
        'Capture one bold experiment connected to behaviour.',
        'Note signals that confirm behaviour is thriving.',
        'Document risks that could erode behaviour if ignored.',
        'Imagine how behaviour feels when everything clicks.',
        'Outline partnerships that reinforce behaviour.',
        'Surface questions still open about behaviour.',
        'Highlight a customer story that embodies behaviour.',
        'Define a tiny action that nourishes behaviour today.',
        'Express gratitude related to behaviour moments.',
        'Sketch the momentum curve of behaviour across the week.'
],
            ideas: [
        'We could celebrate behaviour by amplifying impact.',
        'Invite investigation to co-create behaviour signals.',
        'Prototype a habit that keeps behaviour visible.',
        'Audit the workflows touching behaviour moments.',
        'Pair up with investigation to unstick behaviour blockers.',
        'Share a win around behaviour with the wider team.',
        'Capture metrics that relate to behaviour in the dashboard.',
        'Host a five-minute retro on behaviour mid-week.',
        'Create an inspirational mood board for behaviour.',
        'Curate a playlist that mirrors the energy of behaviour.',
        'Draft a short story describing behaviour success.',
        'Identify one constraint to relax around behaviour.'
],
            checkpoints: [
        'Confidence in behaviour today',
        'Support requested for behaviour',
        'Signals to monitor for behaviour',
        'Decision pending around behaviour',
        'Celebration planned for behaviour',
        'Learning captured about behaviour',
        'Risk mitigation for behaviour',
        'Data sources verifying behaviour',
        'Stakeholders cheering behaviour',
        'Timeline adjustments affecting behaviour',
        'Resources to unlock behaviour',
        'Experiments for behaviour next'
]
        },
        {
            title: 'Reproduction steps',
            theme: 'steps',
            prompts: [
        'Describe how steps shows up for the bug today.',
        'List the voices who can elevate steps right now.',
        'Capture one bold experiment connected to steps.',
        'Note signals that confirm steps is thriving.',
        'Document risks that could erode steps if ignored.',
        'Imagine how steps feels when everything clicks.',
        'Outline partnerships that reinforce steps.',
        'Surface questions still open about steps.',
        'Highlight a customer story that embodies steps.',
        'Define a tiny action that nourishes steps today.',
        'Express gratitude related to steps moments.',
        'Sketch the momentum curve of steps across the week.'
],
            ideas: [
        'We could celebrate steps by amplifying investigation.',
        'Invite journey to co-create steps signals.',
        'Prototype a habit that keeps steps visible.',
        'Audit the workflows touching steps moments.',
        'Pair up with journey to unstick steps blockers.',
        'Share a win around steps with the wider team.',
        'Capture metrics that relate to steps in the dashboard.',
        'Host a five-minute retro on steps mid-week.',
        'Create an inspirational mood board for steps.',
        'Curate a playlist that mirrors the energy of steps.',
        'Draft a short story describing steps success.',
        'Identify one constraint to relax around steps.'
],
            checkpoints: [
        'Confidence in steps today',
        'Support requested for steps',
        'Signals to monitor for steps',
        'Decision pending around steps',
        'Celebration planned for steps',
        'Learning captured about steps',
        'Risk mitigation for steps',
        'Data sources verifying steps',
        'Stakeholders cheering steps',
        'Timeline adjustments affecting steps',
        'Resources to unlock steps',
        'Experiments for steps next'
]
        },
        {
            title: 'Impact pulse',
            theme: 'impact',
            prompts: [
        'Describe how impact shows up for the bug today.',
        'List the voices who can elevate impact right now.',
        'Capture one bold experiment connected to impact.',
        'Note signals that confirm impact is thriving.',
        'Document risks that could erode impact if ignored.',
        'Imagine how impact feels when everything clicks.',
        'Outline partnerships that reinforce impact.',
        'Surface questions still open about impact.',
        'Highlight a customer story that embodies impact.',
        'Define a tiny action that nourishes impact today.',
        'Express gratitude related to impact moments.',
        'Sketch the momentum curve of impact across the week.'
],
            ideas: [
        'We could celebrate impact by amplifying journey.',
        'Invite environment to co-create impact signals.',
        'Prototype a habit that keeps impact visible.',
        'Audit the workflows touching impact moments.',
        'Pair up with environment to unstick impact blockers.',
        'Share a win around impact with the wider team.',
        'Capture metrics that relate to impact in the dashboard.',
        'Host a five-minute retro on impact mid-week.',
        'Create an inspirational mood board for impact.',
        'Curate a playlist that mirrors the energy of impact.',
        'Draft a short story describing impact success.',
        'Identify one constraint to relax around impact.'
],
            checkpoints: [
        'Confidence in impact today',
        'Support requested for impact',
        'Signals to monitor for impact',
        'Decision pending around impact',
        'Celebration planned for impact',
        'Learning captured about impact',
        'Risk mitigation for impact',
        'Data sources verifying impact',
        'Stakeholders cheering impact',
        'Timeline adjustments affecting impact',
        'Resources to unlock impact',
        'Experiments for impact next'
]
        },
        {
            title: 'Next investigation',
            theme: 'investigation',
            prompts: [
        'Describe how investigation shows up for the bug today.',
        'List the voices who can elevate investigation right now.',
        'Capture one bold experiment connected to investigation.',
        'Note signals that confirm investigation is thriving.',
        'Document risks that could erode investigation if ignored.',
        'Imagine how investigation feels when everything clicks.',
        'Outline partnerships that reinforce investigation.',
        'Surface questions still open about investigation.',
        'Highlight a customer story that embodies investigation.',
        'Define a tiny action that nourishes investigation today.',
        'Express gratitude related to investigation moments.',
        'Sketch the momentum curve of investigation across the week.'
],
            ideas: [
        'We could celebrate investigation by amplifying environment.',
        'Invite trigger to co-create investigation signals.',
        'Prototype a habit that keeps investigation visible.',
        'Audit the workflows touching investigation moments.',
        'Pair up with trigger to unstick investigation blockers.',
        'Share a win around investigation with the wider team.',
        'Capture metrics that relate to investigation in the dashboard.',
        'Host a five-minute retro on investigation mid-week.',
        'Create an inspirational mood board for investigation.',
        'Curate a playlist that mirrors the energy of investigation.',
        'Draft a short story describing investigation success.',
        'Identify one constraint to relax around investigation.'
],
            checkpoints: [
        'Confidence in investigation today',
        'Support requested for investigation',
        'Signals to monitor for investigation',
        'Decision pending around investigation',
        'Celebration planned for investigation',
        'Learning captured about investigation',
        'Risk mitigation for investigation',
        'Data sources verifying investigation',
        'Stakeholders cheering investigation',
        'Timeline adjustments affecting investigation',
        'Resources to unlock investigation',
        'Experiments for investigation next'
]
        }
],
        affirmations: [
        'We protect momentum even when things wobble.',
        'Curiosity fuels every iteration we attempt.',
        'We celebrate micro-wins loudly and often.',
        'Humans first, then process, then tooling.',
        'We learn faster together than alone.',
        'Every obstacle carries a hidden insight.',
        'Joy and rigor can absolutely coexist.',
        'We narrate progress so others feel invited.',
        'Pauses are an intentional productivity move.',
        'We choose clarity over speed when needed.',
        'Listening deeply is our superpower.',
        'We prioritise kindness without losing edge.',
        'Celebration is a strategy, not an afterthought.',
        'Asking better questions unlocks better answers.',
        'We leave room for surprise and delight.',
        'Tiny experiments accumulate into bold impact.',
        'Documenting context keeps the future grateful.',
        'We signal progress with warmth and precision.',
        'Reflection is the bridge between today and tomorrow.',
        'We craft experiences that feel like a conversation.',
        'We choose journey storyline',
        'We choose journey highlight',
        'We choose journey question',
        'We choose journey invitation',
        'We choose journey experiment',
        'We choose environment storyline',
        'We choose environment highlight',
        'We choose environment question',
        'We choose environment invitation',
        'We choose environment experiment',
        'We choose trigger storyline',
        'We choose trigger highlight',
        'We choose trigger question',
        'We choose trigger invitation',
        'We choose trigger experiment',
        'We choose expectation storyline',
        'We choose expectation highlight',
        'We choose expectation question',
        'We choose expectation invitation',
        'We choose expectation experiment',
        'We choose behaviour storyline',
        'We choose behaviour highlight',
        'We choose behaviour question',
        'We choose behaviour invitation',
        'We choose behaviour experiment',
        'We choose steps storyline',
        'We choose steps highlight',
        'We choose steps question',
        'We choose steps invitation',
        'We choose steps experiment',
        'We choose impact storyline',
        'We choose impact highlight',
        'We choose impact question',
        'We choose impact invitation',
        'We choose impact experiment',
        'We choose investigation storyline',
        'We choose investigation highlight',
        'We choose investigation question',
        'We choose investigation invitation',
        'We choose investigation experiment'
],
        defaultConfig: {
    title: 'Bug report storyteller',
    tone: 'precise',
    sections: 'User journey,Environment sketch,Trigger moments,Expected rhythm',
    includeReflection: true,
    customHighlights: ''
},
        form: [
        {
            key: 'title',
            label: 'Template title',
            type: 'text',
            placeholder: 'Bug report storyteller'
        },
        {
            key: 'tone',
            label: 'Tone',
            type: 'select',
            options: [
        {
            value: 'precise',
            label: 'Precise'
        },
        {
            value: 'empathetic',
            label: 'Empathetic'
        },
        {
            value: 'curious',
            label: 'Curious'
        },
        {
            value: 'pragmatic',
            label: 'Pragmatic'
        },
        {
            value: 'thorough',
            label: 'Thorough'
        }
]
        },
        {
            key: 'sections',
            label: 'Sections to include',
            type: 'textarea',
            rows: 3,
            placeholder: 'User journey,Environment sketch,Trigger moments,Expected rhythm'
        },
        {
            key: 'includeReflection',
            label: 'Add reflection prompts',
            type: 'checkbox'
        },
        {
            key: 'customHighlights',
            label: 'Custom highlights',
            type: 'textarea',
            rows: 3,
            placeholder: 'Wins to celebrate'
        }
]
    },
    {
        id: 'extended-trigger-sprint-goals',
        category: 'trigger',
        name: 'Sprint goal composer',
        description: 'Compose sprint goals with focus areas, bets, and celebration rituals.',
        icon: 'target',
        accent: '#6366f1',
        tags: [
        'template',
        'agile',
        'focus',
        'trigger'
],
        mode: 'template',
        topic: 'the sprint',
        tones: [
        'motivated',
        'aligned',
        'optimistic',
        'playful',
        'disciplined'
],
        sections: [
        {
            title: 'Mission headline',
            theme: 'mission',
            prompts: [
        'Describe how mission shows up for the sprint today.',
        'List the voices who can elevate mission right now.',
        'Capture one bold experiment connected to mission.',
        'Note signals that confirm mission is thriving.',
        'Document risks that could erode mission if ignored.',
        'Imagine how mission feels when everything clicks.',
        'Outline partnerships that reinforce mission.',
        'Surface questions still open about mission.',
        'Highlight a customer story that embodies mission.',
        'Define a tiny action that nourishes mission today.',
        'Express gratitude related to mission moments.',
        'Sketch the momentum curve of mission across the week.'
],
            ideas: [
        'We could celebrate mission by amplifying signal.',
        'Invite support to co-create mission signals.',
        'Prototype a habit that keeps mission visible.',
        'Audit the workflows touching mission moments.',
        'Pair up with support to unstick mission blockers.',
        'Share a win around mission with the wider team.',
        'Capture metrics that relate to mission in the dashboard.',
        'Host a five-minute retro on mission mid-week.',
        'Create an inspirational mood board for mission.',
        'Curate a playlist that mirrors the energy of mission.',
        'Draft a short story describing mission success.',
        'Identify one constraint to relax around mission.'
],
            checkpoints: [
        'Confidence in mission today',
        'Support requested for mission',
        'Signals to monitor for mission',
        'Decision pending around mission',
        'Celebration planned for mission',
        'Learning captured about mission',
        'Risk mitigation for mission',
        'Data sources verifying mission',
        'Stakeholders cheering mission',
        'Timeline adjustments affecting mission',
        'Resources to unlock mission',
        'Experiments for mission next'
]
        },
        {
            title: 'Key bets',
            theme: 'bet',
            prompts: [
        'Describe how bet shows up for the sprint today.',
        'List the voices who can elevate bet right now.',
        'Capture one bold experiment connected to bet.',
        'Note signals that confirm bet is thriving.',
        'Document risks that could erode bet if ignored.',
        'Imagine how bet feels when everything clicks.',
        'Outline partnerships that reinforce bet.',
        'Surface questions still open about bet.',
        'Highlight a customer story that embodies bet.',
        'Define a tiny action that nourishes bet today.',
        'Express gratitude related to bet moments.',
        'Sketch the momentum curve of bet across the week.'
],
            ideas: [
        'We could celebrate bet by amplifying support.',
        'Invite guardrail to co-create bet signals.',
        'Prototype a habit that keeps bet visible.',
        'Audit the workflows touching bet moments.',
        'Pair up with guardrail to unstick bet blockers.',
        'Share a win around bet with the wider team.',
        'Capture metrics that relate to bet in the dashboard.',
        'Host a five-minute retro on bet mid-week.',
        'Create an inspirational mood board for bet.',
        'Curate a playlist that mirrors the energy of bet.',
        'Draft a short story describing bet success.',
        'Identify one constraint to relax around bet.'
],
            checkpoints: [
        'Confidence in bet today',
        'Support requested for bet',
        'Signals to monitor for bet',
        'Decision pending around bet',
        'Celebration planned for bet',
        'Learning captured about bet',
        'Risk mitigation for bet',
        'Data sources verifying bet',
        'Stakeholders cheering bet',
        'Timeline adjustments affecting bet',
        'Resources to unlock bet',
        'Experiments for bet next'
]
        },
        {
            title: 'Success signals',
            theme: 'signal',
            prompts: [
        'Describe how signal shows up for the sprint today.',
        'List the voices who can elevate signal right now.',
        'Capture one bold experiment connected to signal.',
        'Note signals that confirm signal is thriving.',
        'Document risks that could erode signal if ignored.',
        'Imagine how signal feels when everything clicks.',
        'Outline partnerships that reinforce signal.',
        'Surface questions still open about signal.',
        'Highlight a customer story that embodies signal.',
        'Define a tiny action that nourishes signal today.',
        'Express gratitude related to signal moments.',
        'Sketch the momentum curve of signal across the week.'
],
            ideas: [
        'We could celebrate signal by amplifying guardrail.',
        'Invite learning to co-create signal signals.',
        'Prototype a habit that keeps signal visible.',
        'Audit the workflows touching signal moments.',
        'Pair up with learning to unstick signal blockers.',
        'Share a win around signal with the wider team.',
        'Capture metrics that relate to signal in the dashboard.',
        'Host a five-minute retro on signal mid-week.',
        'Create an inspirational mood board for signal.',
        'Curate a playlist that mirrors the energy of signal.',
        'Draft a short story describing signal success.',
        'Identify one constraint to relax around signal.'
],
            checkpoints: [
        'Confidence in signal today',
        'Support requested for signal',
        'Signals to monitor for signal',
        'Decision pending around signal',
        'Celebration planned for signal',
        'Learning captured about signal',
        'Risk mitigation for signal',
        'Data sources verifying signal',
        'Stakeholders cheering signal',
        'Timeline adjustments affecting signal',
        'Resources to unlock signal',
        'Experiments for signal next'
]
        },
        {
            title: 'Support needed',
            theme: 'support',
            prompts: [
        'Describe how support shows up for the sprint today.',
        'List the voices who can elevate support right now.',
        'Capture one bold experiment connected to support.',
        'Note signals that confirm support is thriving.',
        'Document risks that could erode support if ignored.',
        'Imagine how support feels when everything clicks.',
        'Outline partnerships that reinforce support.',
        'Surface questions still open about support.',
        'Highlight a customer story that embodies support.',
        'Define a tiny action that nourishes support today.',
        'Express gratitude related to support moments.',
        'Sketch the momentum curve of support across the week.'
],
            ideas: [
        'We could celebrate support by amplifying learning.',
        'Invite celebration to co-create support signals.',
        'Prototype a habit that keeps support visible.',
        'Audit the workflows touching support moments.',
        'Pair up with celebration to unstick support blockers.',
        'Share a win around support with the wider team.',
        'Capture metrics that relate to support in the dashboard.',
        'Host a five-minute retro on support mid-week.',
        'Create an inspirational mood board for support.',
        'Curate a playlist that mirrors the energy of support.',
        'Draft a short story describing support success.',
        'Identify one constraint to relax around support.'
],
            checkpoints: [
        'Confidence in support today',
        'Support requested for support',
        'Signals to monitor for support',
        'Decision pending around support',
        'Celebration planned for support',
        'Learning captured about support',
        'Risk mitigation for support',
        'Data sources verifying support',
        'Stakeholders cheering support',
        'Timeline adjustments affecting support',
        'Resources to unlock support',
        'Experiments for support next'
]
        },
        {
            title: 'Focus guardrails',
            theme: 'guardrail',
            prompts: [
        'Describe how guardrail shows up for the sprint today.',
        'List the voices who can elevate guardrail right now.',
        'Capture one bold experiment connected to guardrail.',
        'Note signals that confirm guardrail is thriving.',
        'Document risks that could erode guardrail if ignored.',
        'Imagine how guardrail feels when everything clicks.',
        'Outline partnerships that reinforce guardrail.',
        'Surface questions still open about guardrail.',
        'Highlight a customer story that embodies guardrail.',
        'Define a tiny action that nourishes guardrail today.',
        'Express gratitude related to guardrail moments.',
        'Sketch the momentum curve of guardrail across the week.'
],
            ideas: [
        'We could celebrate guardrail by amplifying celebration.',
        'Invite health to co-create guardrail signals.',
        'Prototype a habit that keeps guardrail visible.',
        'Audit the workflows touching guardrail moments.',
        'Pair up with health to unstick guardrail blockers.',
        'Share a win around guardrail with the wider team.',
        'Capture metrics that relate to guardrail in the dashboard.',
        'Host a five-minute retro on guardrail mid-week.',
        'Create an inspirational mood board for guardrail.',
        'Curate a playlist that mirrors the energy of guardrail.',
        'Draft a short story describing guardrail success.',
        'Identify one constraint to relax around guardrail.'
],
            checkpoints: [
        'Confidence in guardrail today',
        'Support requested for guardrail',
        'Signals to monitor for guardrail',
        'Decision pending around guardrail',
        'Celebration planned for guardrail',
        'Learning captured about guardrail',
        'Risk mitigation for guardrail',
        'Data sources verifying guardrail',
        'Stakeholders cheering guardrail',
        'Timeline adjustments affecting guardrail',
        'Resources to unlock guardrail',
        'Experiments for guardrail next'
]
        },
        {
            title: 'Learning agenda',
            theme: 'learning',
            prompts: [
        'Describe how learning shows up for the sprint today.',
        'List the voices who can elevate learning right now.',
        'Capture one bold experiment connected to learning.',
        'Note signals that confirm learning is thriving.',
        'Document risks that could erode learning if ignored.',
        'Imagine how learning feels when everything clicks.',
        'Outline partnerships that reinforce learning.',
        'Surface questions still open about learning.',
        'Highlight a customer story that embodies learning.',
        'Define a tiny action that nourishes learning today.',
        'Express gratitude related to learning moments.',
        'Sketch the momentum curve of learning across the week.'
],
            ideas: [
        'We could celebrate learning by amplifying health.',
        'Invite mission to co-create learning signals.',
        'Prototype a habit that keeps learning visible.',
        'Audit the workflows touching learning moments.',
        'Pair up with mission to unstick learning blockers.',
        'Share a win around learning with the wider team.',
        'Capture metrics that relate to learning in the dashboard.',
        'Host a five-minute retro on learning mid-week.',
        'Create an inspirational mood board for learning.',
        'Curate a playlist that mirrors the energy of learning.',
        'Draft a short story describing learning success.',
        'Identify one constraint to relax around learning.'
],
            checkpoints: [
        'Confidence in learning today',
        'Support requested for learning',
        'Signals to monitor for learning',
        'Decision pending around learning',
        'Celebration planned for learning',
        'Learning captured about learning',
        'Risk mitigation for learning',
        'Data sources verifying learning',
        'Stakeholders cheering learning',
        'Timeline adjustments affecting learning',
        'Resources to unlock learning',
        'Experiments for learning next'
]
        },
        {
            title: 'Celebration cues',
            theme: 'celebration',
            prompts: [
        'Describe how celebration shows up for the sprint today.',
        'List the voices who can elevate celebration right now.',
        'Capture one bold experiment connected to celebration.',
        'Note signals that confirm celebration is thriving.',
        'Document risks that could erode celebration if ignored.',
        'Imagine how celebration feels when everything clicks.',
        'Outline partnerships that reinforce celebration.',
        'Surface questions still open about celebration.',
        'Highlight a customer story that embodies celebration.',
        'Define a tiny action that nourishes celebration today.',
        'Express gratitude related to celebration moments.',
        'Sketch the momentum curve of celebration across the week.'
],
            ideas: [
        'We could celebrate celebration by amplifying mission.',
        'Invite bet to co-create celebration signals.',
        'Prototype a habit that keeps celebration visible.',
        'Audit the workflows touching celebration moments.',
        'Pair up with bet to unstick celebration blockers.',
        'Share a win around celebration with the wider team.',
        'Capture metrics that relate to celebration in the dashboard.',
        'Host a five-minute retro on celebration mid-week.',
        'Create an inspirational mood board for celebration.',
        'Curate a playlist that mirrors the energy of celebration.',
        'Draft a short story describing celebration success.',
        'Identify one constraint to relax around celebration.'
],
            checkpoints: [
        'Confidence in celebration today',
        'Support requested for celebration',
        'Signals to monitor for celebration',
        'Decision pending around celebration',
        'Celebration planned for celebration',
        'Learning captured about celebration',
        'Risk mitigation for celebration',
        'Data sources verifying celebration',
        'Stakeholders cheering celebration',
        'Timeline adjustments affecting celebration',
        'Resources to unlock celebration',
        'Experiments for celebration next'
]
        },
        {
            title: 'Health metrics',
            theme: 'health',
            prompts: [
        'Describe how health shows up for the sprint today.',
        'List the voices who can elevate health right now.',
        'Capture one bold experiment connected to health.',
        'Note signals that confirm health is thriving.',
        'Document risks that could erode health if ignored.',
        'Imagine how health feels when everything clicks.',
        'Outline partnerships that reinforce health.',
        'Surface questions still open about health.',
        'Highlight a customer story that embodies health.',
        'Define a tiny action that nourishes health today.',
        'Express gratitude related to health moments.',
        'Sketch the momentum curve of health across the week.'
],
            ideas: [
        'We could celebrate health by amplifying bet.',
        'Invite signal to co-create health signals.',
        'Prototype a habit that keeps health visible.',
        'Audit the workflows touching health moments.',
        'Pair up with signal to unstick health blockers.',
        'Share a win around health with the wider team.',
        'Capture metrics that relate to health in the dashboard.',
        'Host a five-minute retro on health mid-week.',
        'Create an inspirational mood board for health.',
        'Curate a playlist that mirrors the energy of health.',
        'Draft a short story describing health success.',
        'Identify one constraint to relax around health.'
],
            checkpoints: [
        'Confidence in health today',
        'Support requested for health',
        'Signals to monitor for health',
        'Decision pending around health',
        'Celebration planned for health',
        'Learning captured about health',
        'Risk mitigation for health',
        'Data sources verifying health',
        'Stakeholders cheering health',
        'Timeline adjustments affecting health',
        'Resources to unlock health',
        'Experiments for health next'
]
        }
],
        affirmations: [
        'We protect momentum even when things wobble.',
        'Curiosity fuels every iteration we attempt.',
        'We celebrate micro-wins loudly and often.',
        'Humans first, then process, then tooling.',
        'We learn faster together than alone.',
        'Every obstacle carries a hidden insight.',
        'Joy and rigor can absolutely coexist.',
        'We narrate progress so others feel invited.',
        'Pauses are an intentional productivity move.',
        'We choose clarity over speed when needed.',
        'Listening deeply is our superpower.',
        'We prioritise kindness without losing edge.',
        'Celebration is a strategy, not an afterthought.',
        'Asking better questions unlocks better answers.',
        'We leave room for surprise and delight.',
        'Tiny experiments accumulate into bold impact.',
        'Documenting context keeps the future grateful.',
        'We signal progress with warmth and precision.',
        'Reflection is the bridge between today and tomorrow.',
        'We craft experiences that feel like a conversation.',
        'We choose mission storyline',
        'We choose mission highlight',
        'We choose mission question',
        'We choose mission invitation',
        'We choose mission experiment',
        'We choose bet storyline',
        'We choose bet highlight',
        'We choose bet question',
        'We choose bet invitation',
        'We choose bet experiment',
        'We choose signal storyline',
        'We choose signal highlight',
        'We choose signal question',
        'We choose signal invitation',
        'We choose signal experiment',
        'We choose support storyline',
        'We choose support highlight',
        'We choose support question',
        'We choose support invitation',
        'We choose support experiment',
        'We choose guardrail storyline',
        'We choose guardrail highlight',
        'We choose guardrail question',
        'We choose guardrail invitation',
        'We choose guardrail experiment',
        'We choose learning storyline',
        'We choose learning highlight',
        'We choose learning question',
        'We choose learning invitation',
        'We choose learning experiment',
        'We choose celebration storyline',
        'We choose celebration highlight',
        'We choose celebration question',
        'We choose celebration invitation',
        'We choose celebration experiment',
        'We choose health storyline',
        'We choose health highlight',
        'We choose health question',
        'We choose health invitation',
        'We choose health experiment'
],
        defaultConfig: {
    title: 'Sprint goal composer',
    tone: 'motivated',
    sections: 'Mission headline,Key bets,Success signals,Support needed',
    includeReflection: true,
    customHighlights: ''
},
        form: [
        {
            key: 'title',
            label: 'Template title',
            type: 'text',
            placeholder: 'Sprint goal composer'
        },
        {
            key: 'tone',
            label: 'Tone',
            type: 'select',
            options: [
        {
            value: 'motivated',
            label: 'Motivated'
        },
        {
            value: 'aligned',
            label: 'Aligned'
        },
        {
            value: 'optimistic',
            label: 'Optimistic'
        },
        {
            value: 'playful',
            label: 'Playful'
        },
        {
            value: 'disciplined',
            label: 'Disciplined'
        }
]
        },
        {
            key: 'sections',
            label: 'Sections to include',
            type: 'textarea',
            rows: 3,
            placeholder: 'Mission headline,Key bets,Success signals,Support needed'
        },
        {
            key: 'includeReflection',
            label: 'Add reflection prompts',
            type: 'checkbox'
        },
        {
            key: 'customHighlights',
            label: 'Custom highlights',
            type: 'textarea',
            rows: 3,
            placeholder: 'Wins to celebrate'
        }
]
    },
    {
        id: 'extended-trigger-brand-voice',
        category: 'trigger',
        name: 'Brand voice playground',
        description: 'Shape a brand voice session with tone sliders, vocabulary, and storytelling frames.',
        icon: 'type',
        accent: '#f472b6',
        tags: [
        'template',
        'brand',
        'language',
        'trigger'
],
        mode: 'template',
        topic: 'the brand',
        tones: [
        'warm',
        'audacious',
        'calm',
        'wit',
        'trusted'
],
        sections: [
        {
            title: 'Voice adjectives',
            theme: 'adjective',
            prompts: [
        'Describe how adjective shows up for the brand today.',
        'List the voices who can elevate adjective right now.',
        'Capture one bold experiment connected to adjective.',
        'Note signals that confirm adjective is thriving.',
        'Document risks that could erode adjective if ignored.',
        'Imagine how adjective feels when everything clicks.',
        'Outline partnerships that reinforce adjective.',
        'Surface questions still open about adjective.',
        'Highlight a customer story that embodies adjective.',
        'Define a tiny action that nourishes adjective today.',
        'Express gratitude related to adjective moments.',
        'Sketch the momentum curve of adjective across the week.'
],
            ideas: [
        'We could celebrate adjective by amplifying boundaries.',
        'Invite cadence to co-create adjective signals.',
        'Prototype a habit that keeps adjective visible.',
        'Audit the workflows touching adjective moments.',
        'Pair up with cadence to unstick adjective blockers.',
        'Share a win around adjective with the wider team.',
        'Capture metrics that relate to adjective in the dashboard.',
        'Host a five-minute retro on adjective mid-week.',
        'Create an inspirational mood board for adjective.',
        'Curate a playlist that mirrors the energy of adjective.',
        'Draft a short story describing adjective success.',
        'Identify one constraint to relax around adjective.'
],
            checkpoints: [
        'Confidence in adjective today',
        'Support requested for adjective',
        'Signals to monitor for adjective',
        'Decision pending around adjective',
        'Celebration planned for adjective',
        'Learning captured about adjective',
        'Risk mitigation for adjective',
        'Data sources verifying adjective',
        'Stakeholders cheering adjective',
        'Timeline adjustments affecting adjective',
        'Resources to unlock adjective',
        'Experiments for adjective next'
]
        },
        {
            title: 'Do say',
            theme: 'vocabulary',
            prompts: [
        'Describe how vocabulary shows up for the brand today.',
        'List the voices who can elevate vocabulary right now.',
        'Capture one bold experiment connected to vocabulary.',
        'Note signals that confirm vocabulary is thriving.',
        'Document risks that could erode vocabulary if ignored.',
        'Imagine how vocabulary feels when everything clicks.',
        'Outline partnerships that reinforce vocabulary.',
        'Surface questions still open about vocabulary.',
        'Highlight a customer story that embodies vocabulary.',
        'Define a tiny action that nourishes vocabulary today.',
        'Express gratitude related to vocabulary moments.',
        'Sketch the momentum curve of vocabulary across the week.'
],
            ideas: [
        'We could celebrate vocabulary by amplifying cadence.',
        'Invite emotion to co-create vocabulary signals.',
        'Prototype a habit that keeps vocabulary visible.',
        'Audit the workflows touching vocabulary moments.',
        'Pair up with emotion to unstick vocabulary blockers.',
        'Share a win around vocabulary with the wider team.',
        'Capture metrics that relate to vocabulary in the dashboard.',
        'Host a five-minute retro on vocabulary mid-week.',
        'Create an inspirational mood board for vocabulary.',
        'Curate a playlist that mirrors the energy of vocabulary.',
        'Draft a short story describing vocabulary success.',
        'Identify one constraint to relax around vocabulary.'
],
            checkpoints: [
        'Confidence in vocabulary today',
        'Support requested for vocabulary',
        'Signals to monitor for vocabulary',
        'Decision pending around vocabulary',
        'Celebration planned for vocabulary',
        'Learning captured about vocabulary',
        'Risk mitigation for vocabulary',
        'Data sources verifying vocabulary',
        'Stakeholders cheering vocabulary',
        'Timeline adjustments affecting vocabulary',
        'Resources to unlock vocabulary',
        'Experiments for vocabulary next'
]
        },
        {
            title: 'Avoid saying',
            theme: 'boundaries',
            prompts: [
        'Describe how boundaries shows up for the brand today.',
        'List the voices who can elevate boundaries right now.',
        'Capture one bold experiment connected to boundaries.',
        'Note signals that confirm boundaries is thriving.',
        'Document risks that could erode boundaries if ignored.',
        'Imagine how boundaries feels when everything clicks.',
        'Outline partnerships that reinforce boundaries.',
        'Surface questions still open about boundaries.',
        'Highlight a customer story that embodies boundaries.',
        'Define a tiny action that nourishes boundaries today.',
        'Express gratitude related to boundaries moments.',
        'Sketch the momentum curve of boundaries across the week.'
],
            ideas: [
        'We could celebrate boundaries by amplifying emotion.',
        'Invite signature to co-create boundaries signals.',
        'Prototype a habit that keeps boundaries visible.',
        'Audit the workflows touching boundaries moments.',
        'Pair up with signature to unstick boundaries blockers.',
        'Share a win around boundaries with the wider team.',
        'Capture metrics that relate to boundaries in the dashboard.',
        'Host a five-minute retro on boundaries mid-week.',
        'Create an inspirational mood board for boundaries.',
        'Curate a playlist that mirrors the energy of boundaries.',
        'Draft a short story describing boundaries success.',
        'Identify one constraint to relax around boundaries.'
],
            checkpoints: [
        'Confidence in boundaries today',
        'Support requested for boundaries',
        'Signals to monitor for boundaries',
        'Decision pending around boundaries',
        'Celebration planned for boundaries',
        'Learning captured about boundaries',
        'Risk mitigation for boundaries',
        'Data sources verifying boundaries',
        'Stakeholders cheering boundaries',
        'Timeline adjustments affecting boundaries',
        'Resources to unlock boundaries',
        'Experiments for boundaries next'
]
        },
        {
            title: 'Story cadence',
            theme: 'cadence',
            prompts: [
        'Describe how cadence shows up for the brand today.',
        'List the voices who can elevate cadence right now.',
        'Capture one bold experiment connected to cadence.',
        'Note signals that confirm cadence is thriving.',
        'Document risks that could erode cadence if ignored.',
        'Imagine how cadence feels when everything clicks.',
        'Outline partnerships that reinforce cadence.',
        'Surface questions still open about cadence.',
        'Highlight a customer story that embodies cadence.',
        'Define a tiny action that nourishes cadence today.',
        'Express gratitude related to cadence moments.',
        'Sketch the momentum curve of cadence across the week.'
],
            ideas: [
        'We could celebrate cadence by amplifying signature.',
        'Invite slider to co-create cadence signals.',
        'Prototype a habit that keeps cadence visible.',
        'Audit the workflows touching cadence moments.',
        'Pair up with slider to unstick cadence blockers.',
        'Share a win around cadence with the wider team.',
        'Capture metrics that relate to cadence in the dashboard.',
        'Host a five-minute retro on cadence mid-week.',
        'Create an inspirational mood board for cadence.',
        'Curate a playlist that mirrors the energy of cadence.',
        'Draft a short story describing cadence success.',
        'Identify one constraint to relax around cadence.'
],
            checkpoints: [
        'Confidence in cadence today',
        'Support requested for cadence',
        'Signals to monitor for cadence',
        'Decision pending around cadence',
        'Celebration planned for cadence',
        'Learning captured about cadence',
        'Risk mitigation for cadence',
        'Data sources verifying cadence',
        'Stakeholders cheering cadence',
        'Timeline adjustments affecting cadence',
        'Resources to unlock cadence',
        'Experiments for cadence next'
]
        },
        {
            title: 'Emotion anchors',
            theme: 'emotion',
            prompts: [
        'Describe how emotion shows up for the brand today.',
        'List the voices who can elevate emotion right now.',
        'Capture one bold experiment connected to emotion.',
        'Note signals that confirm emotion is thriving.',
        'Document risks that could erode emotion if ignored.',
        'Imagine how emotion feels when everything clicks.',
        'Outline partnerships that reinforce emotion.',
        'Surface questions still open about emotion.',
        'Highlight a customer story that embodies emotion.',
        'Define a tiny action that nourishes emotion today.',
        'Express gratitude related to emotion moments.',
        'Sketch the momentum curve of emotion across the week.'
],
            ideas: [
        'We could celebrate emotion by amplifying slider.',
        'Invite experiment to co-create emotion signals.',
        'Prototype a habit that keeps emotion visible.',
        'Audit the workflows touching emotion moments.',
        'Pair up with experiment to unstick emotion blockers.',
        'Share a win around emotion with the wider team.',
        'Capture metrics that relate to emotion in the dashboard.',
        'Host a five-minute retro on emotion mid-week.',
        'Create an inspirational mood board for emotion.',
        'Curate a playlist that mirrors the energy of emotion.',
        'Draft a short story describing emotion success.',
        'Identify one constraint to relax around emotion.'
],
            checkpoints: [
        'Confidence in emotion today',
        'Support requested for emotion',
        'Signals to monitor for emotion',
        'Decision pending around emotion',
        'Celebration planned for emotion',
        'Learning captured about emotion',
        'Risk mitigation for emotion',
        'Data sources verifying emotion',
        'Stakeholders cheering emotion',
        'Timeline adjustments affecting emotion',
        'Resources to unlock emotion',
        'Experiments for emotion next'
]
        },
        {
            title: 'Signature phrases',
            theme: 'signature',
            prompts: [
        'Describe how signature shows up for the brand today.',
        'List the voices who can elevate signature right now.',
        'Capture one bold experiment connected to signature.',
        'Note signals that confirm signature is thriving.',
        'Document risks that could erode signature if ignored.',
        'Imagine how signature feels when everything clicks.',
        'Outline partnerships that reinforce signature.',
        'Surface questions still open about signature.',
        'Highlight a customer story that embodies signature.',
        'Define a tiny action that nourishes signature today.',
        'Express gratitude related to signature moments.',
        'Sketch the momentum curve of signature across the week.'
],
            ideas: [
        'We could celebrate signature by amplifying experiment.',
        'Invite adjective to co-create signature signals.',
        'Prototype a habit that keeps signature visible.',
        'Audit the workflows touching signature moments.',
        'Pair up with adjective to unstick signature blockers.',
        'Share a win around signature with the wider team.',
        'Capture metrics that relate to signature in the dashboard.',
        'Host a five-minute retro on signature mid-week.',
        'Create an inspirational mood board for signature.',
        'Curate a playlist that mirrors the energy of signature.',
        'Draft a short story describing signature success.',
        'Identify one constraint to relax around signature.'
],
            checkpoints: [
        'Confidence in signature today',
        'Support requested for signature',
        'Signals to monitor for signature',
        'Decision pending around signature',
        'Celebration planned for signature',
        'Learning captured about signature',
        'Risk mitigation for signature',
        'Data sources verifying signature',
        'Stakeholders cheering signature',
        'Timeline adjustments affecting signature',
        'Resources to unlock signature',
        'Experiments for signature next'
]
        },
        {
            title: 'Tone sliders',
            theme: 'slider',
            prompts: [
        'Describe how slider shows up for the brand today.',
        'List the voices who can elevate slider right now.',
        'Capture one bold experiment connected to slider.',
        'Note signals that confirm slider is thriving.',
        'Document risks that could erode slider if ignored.',
        'Imagine how slider feels when everything clicks.',
        'Outline partnerships that reinforce slider.',
        'Surface questions still open about slider.',
        'Highlight a customer story that embodies slider.',
        'Define a tiny action that nourishes slider today.',
        'Express gratitude related to slider moments.',
        'Sketch the momentum curve of slider across the week.'
],
            ideas: [
        'We could celebrate slider by amplifying adjective.',
        'Invite vocabulary to co-create slider signals.',
        'Prototype a habit that keeps slider visible.',
        'Audit the workflows touching slider moments.',
        'Pair up with vocabulary to unstick slider blockers.',
        'Share a win around slider with the wider team.',
        'Capture metrics that relate to slider in the dashboard.',
        'Host a five-minute retro on slider mid-week.',
        'Create an inspirational mood board for slider.',
        'Curate a playlist that mirrors the energy of slider.',
        'Draft a short story describing slider success.',
        'Identify one constraint to relax around slider.'
],
            checkpoints: [
        'Confidence in slider today',
        'Support requested for slider',
        'Signals to monitor for slider',
        'Decision pending around slider',
        'Celebration planned for slider',
        'Learning captured about slider',
        'Risk mitigation for slider',
        'Data sources verifying slider',
        'Stakeholders cheering slider',
        'Timeline adjustments affecting slider',
        'Resources to unlock slider',
        'Experiments for slider next'
]
        },
        {
            title: 'Playful experiments',
            theme: 'experiment',
            prompts: [
        'Describe how experiment shows up for the brand today.',
        'List the voices who can elevate experiment right now.',
        'Capture one bold experiment connected to experiment.',
        'Note signals that confirm experiment is thriving.',
        'Document risks that could erode experiment if ignored.',
        'Imagine how experiment feels when everything clicks.',
        'Outline partnerships that reinforce experiment.',
        'Surface questions still open about experiment.',
        'Highlight a customer story that embodies experiment.',
        'Define a tiny action that nourishes experiment today.',
        'Express gratitude related to experiment moments.',
        'Sketch the momentum curve of experiment across the week.'
],
            ideas: [
        'We could celebrate experiment by amplifying vocabulary.',
        'Invite boundaries to co-create experiment signals.',
        'Prototype a habit that keeps experiment visible.',
        'Audit the workflows touching experiment moments.',
        'Pair up with boundaries to unstick experiment blockers.',
        'Share a win around experiment with the wider team.',
        'Capture metrics that relate to experiment in the dashboard.',
        'Host a five-minute retro on experiment mid-week.',
        'Create an inspirational mood board for experiment.',
        'Curate a playlist that mirrors the energy of experiment.',
        'Draft a short story describing experiment success.',
        'Identify one constraint to relax around experiment.'
],
            checkpoints: [
        'Confidence in experiment today',
        'Support requested for experiment',
        'Signals to monitor for experiment',
        'Decision pending around experiment',
        'Celebration planned for experiment',
        'Learning captured about experiment',
        'Risk mitigation for experiment',
        'Data sources verifying experiment',
        'Stakeholders cheering experiment',
        'Timeline adjustments affecting experiment',
        'Resources to unlock experiment',
        'Experiments for experiment next'
]
        }
],
        affirmations: [
        'We protect momentum even when things wobble.',
        'Curiosity fuels every iteration we attempt.',
        'We celebrate micro-wins loudly and often.',
        'Humans first, then process, then tooling.',
        'We learn faster together than alone.',
        'Every obstacle carries a hidden insight.',
        'Joy and rigor can absolutely coexist.',
        'We narrate progress so others feel invited.',
        'Pauses are an intentional productivity move.',
        'We choose clarity over speed when needed.',
        'Listening deeply is our superpower.',
        'We prioritise kindness without losing edge.',
        'Celebration is a strategy, not an afterthought.',
        'Asking better questions unlocks better answers.',
        'We leave room for surprise and delight.',
        'Tiny experiments accumulate into bold impact.',
        'Documenting context keeps the future grateful.',
        'We signal progress with warmth and precision.',
        'Reflection is the bridge between today and tomorrow.',
        'We craft experiences that feel like a conversation.',
        'We choose adjective storyline',
        'We choose adjective highlight',
        'We choose adjective question',
        'We choose adjective invitation',
        'We choose adjective experiment',
        'We choose vocabulary storyline',
        'We choose vocabulary highlight',
        'We choose vocabulary question',
        'We choose vocabulary invitation',
        'We choose vocabulary experiment',
        'We choose boundaries storyline',
        'We choose boundaries highlight',
        'We choose boundaries question',
        'We choose boundaries invitation',
        'We choose boundaries experiment',
        'We choose cadence storyline',
        'We choose cadence highlight',
        'We choose cadence question',
        'We choose cadence invitation',
        'We choose cadence experiment',
        'We choose emotion storyline',
        'We choose emotion highlight',
        'We choose emotion question',
        'We choose emotion invitation',
        'We choose emotion experiment',
        'We choose signature storyline',
        'We choose signature highlight',
        'We choose signature question',
        'We choose signature invitation',
        'We choose signature experiment',
        'We choose slider storyline',
        'We choose slider highlight',
        'We choose slider question',
        'We choose slider invitation',
        'We choose slider experiment',
        'We choose experiment storyline',
        'We choose experiment highlight',
        'We choose experiment question',
        'We choose experiment invitation',
        'We choose experiment experiment'
],
        defaultConfig: {
    title: 'Brand voice playground',
    tone: 'warm',
    sections: 'Voice adjectives,Do say,Avoid saying,Story cadence',
    includeReflection: true,
    customHighlights: ''
},
        form: [
        {
            key: 'title',
            label: 'Template title',
            type: 'text',
            placeholder: 'Brand voice playground'
        },
        {
            key: 'tone',
            label: 'Tone',
            type: 'select',
            options: [
        {
            value: 'warm',
            label: 'Warm'
        },
        {
            value: 'audacious',
            label: 'Audacious'
        },
        {
            value: 'calm',
            label: 'Calm'
        },
        {
            value: 'wit',
            label: 'Wit'
        },
        {
            value: 'trusted',
            label: 'Trusted'
        }
]
        },
        {
            key: 'sections',
            label: 'Sections to include',
            type: 'textarea',
            rows: 3,
            placeholder: 'Voice adjectives,Do say,Avoid saying,Story cadence'
        },
        {
            key: 'includeReflection',
            label: 'Add reflection prompts',
            type: 'checkbox'
        },
        {
            key: 'customHighlights',
            label: 'Custom highlights',
            type: 'textarea',
            rows: 3,
            placeholder: 'Wins to celebrate'
        }
]
    },
    {
        id: 'extended-trigger-customer-journey',
        category: 'trigger',
        name: 'Customer journey sketchbook',
        description: 'Map the customer journey with feelings, questions, and delight moments.',
        icon: 'map',
        accent: '#22d3ee',
        tags: [
        'template',
        'research',
        'journey',
        'trigger'
],
        mode: 'template',
        topic: 'the journey',
        tones: [
        'empathetic',
        'adventurous',
        'curious',
        'detailed',
        'playful'
],
        sections: [
        {
            title: 'Stage snapshot',
            theme: 'stage',
            prompts: [
        'Describe how stage shows up for the journey today.',
        'List the voices who can elevate stage right now.',
        'Capture one bold experiment connected to stage.',
        'Note signals that confirm stage is thriving.',
        'Document risks that could erode stage if ignored.',
        'Imagine how stage feels when everything clicks.',
        'Outline partnerships that reinforce stage.',
        'Surface questions still open about stage.',
        'Highlight a customer story that embodies stage.',
        'Define a tiny action that nourishes stage today.',
        'Express gratitude related to stage moments.',
        'Sketch the momentum curve of stage across the week.'
],
            ideas: [
        'We could celebrate stage by amplifying question.',
        'Invite friction to co-create stage signals.',
        'Prototype a habit that keeps stage visible.',
        'Audit the workflows touching stage moments.',
        'Pair up with friction to unstick stage blockers.',
        'Share a win around stage with the wider team.',
        'Capture metrics that relate to stage in the dashboard.',
        'Host a five-minute retro on stage mid-week.',
        'Create an inspirational mood board for stage.',
        'Curate a playlist that mirrors the energy of stage.',
        'Draft a short story describing stage success.',
        'Identify one constraint to relax around stage.'
],
            checkpoints: [
        'Confidence in stage today',
        'Support requested for stage',
        'Signals to monitor for stage',
        'Decision pending around stage',
        'Celebration planned for stage',
        'Learning captured about stage',
        'Risk mitigation for stage',
        'Data sources verifying stage',
        'Stakeholders cheering stage',
        'Timeline adjustments affecting stage',
        'Resources to unlock stage',
        'Experiments for stage next'
]
        },
        {
            title: 'Emotion timeline',
            theme: 'emotion',
            prompts: [
        'Describe how emotion shows up for the journey today.',
        'List the voices who can elevate emotion right now.',
        'Capture one bold experiment connected to emotion.',
        'Note signals that confirm emotion is thriving.',
        'Document risks that could erode emotion if ignored.',
        'Imagine how emotion feels when everything clicks.',
        'Outline partnerships that reinforce emotion.',
        'Surface questions still open about emotion.',
        'Highlight a customer story that embodies emotion.',
        'Define a tiny action that nourishes emotion today.',
        'Express gratitude related to emotion moments.',
        'Sketch the momentum curve of emotion across the week.'
],
            ideas: [
        'We could celebrate emotion by amplifying friction.',
        'Invite delight to co-create emotion signals.',
        'Prototype a habit that keeps emotion visible.',
        'Audit the workflows touching emotion moments.',
        'Pair up with delight to unstick emotion blockers.',
        'Share a win around emotion with the wider team.',
        'Capture metrics that relate to emotion in the dashboard.',
        'Host a five-minute retro on emotion mid-week.',
        'Create an inspirational mood board for emotion.',
        'Curate a playlist that mirrors the energy of emotion.',
        'Draft a short story describing emotion success.',
        'Identify one constraint to relax around emotion.'
],
            checkpoints: [
        'Confidence in emotion today',
        'Support requested for emotion',
        'Signals to monitor for emotion',
        'Decision pending around emotion',
        'Celebration planned for emotion',
        'Learning captured about emotion',
        'Risk mitigation for emotion',
        'Data sources verifying emotion',
        'Stakeholders cheering emotion',
        'Timeline adjustments affecting emotion',
        'Resources to unlock emotion',
        'Experiments for emotion next'
]
        },
        {
            title: 'Questions bubbling',
            theme: 'question',
            prompts: [
        'Describe how question shows up for the journey today.',
        'List the voices who can elevate question right now.',
        'Capture one bold experiment connected to question.',
        'Note signals that confirm question is thriving.',
        'Document risks that could erode question if ignored.',
        'Imagine how question feels when everything clicks.',
        'Outline partnerships that reinforce question.',
        'Surface questions still open about question.',
        'Highlight a customer story that embodies question.',
        'Define a tiny action that nourishes question today.',
        'Express gratitude related to question moments.',
        'Sketch the momentum curve of question across the week.'
],
            ideas: [
        'We could celebrate question by amplifying delight.',
        'Invite opportunity to co-create question signals.',
        'Prototype a habit that keeps question visible.',
        'Audit the workflows touching question moments.',
        'Pair up with opportunity to unstick question blockers.',
        'Share a win around question with the wider team.',
        'Capture metrics that relate to question in the dashboard.',
        'Host a five-minute retro on question mid-week.',
        'Create an inspirational mood board for question.',
        'Curate a playlist that mirrors the energy of question.',
        'Draft a short story describing question success.',
        'Identify one constraint to relax around question.'
],
            checkpoints: [
        'Confidence in question today',
        'Support requested for question',
        'Signals to monitor for question',
        'Decision pending around question',
        'Celebration planned for question',
        'Learning captured about question',
        'Risk mitigation for question',
        'Data sources verifying question',
        'Stakeholders cheering question',
        'Timeline adjustments affecting question',
        'Resources to unlock question',
        'Experiments for question next'
]
        },
        {
            title: 'Moments of friction',
            theme: 'friction',
            prompts: [
        'Describe how friction shows up for the journey today.',
        'List the voices who can elevate friction right now.',
        'Capture one bold experiment connected to friction.',
        'Note signals that confirm friction is thriving.',
        'Document risks that could erode friction if ignored.',
        'Imagine how friction feels when everything clicks.',
        'Outline partnerships that reinforce friction.',
        'Surface questions still open about friction.',
        'Highlight a customer story that embodies friction.',
        'Define a tiny action that nourishes friction today.',
        'Express gratitude related to friction moments.',
        'Sketch the momentum curve of friction across the week.'
],
            ideas: [
        'We could celebrate friction by amplifying opportunity.',
        'Invite support to co-create friction signals.',
        'Prototype a habit that keeps friction visible.',
        'Audit the workflows touching friction moments.',
        'Pair up with support to unstick friction blockers.',
        'Share a win around friction with the wider team.',
        'Capture metrics that relate to friction in the dashboard.',
        'Host a five-minute retro on friction mid-week.',
        'Create an inspirational mood board for friction.',
        'Curate a playlist that mirrors the energy of friction.',
        'Draft a short story describing friction success.',
        'Identify one constraint to relax around friction.'
],
            checkpoints: [
        'Confidence in friction today',
        'Support requested for friction',
        'Signals to monitor for friction',
        'Decision pending around friction',
        'Celebration planned for friction',
        'Learning captured about friction',
        'Risk mitigation for friction',
        'Data sources verifying friction',
        'Stakeholders cheering friction',
        'Timeline adjustments affecting friction',
        'Resources to unlock friction',
        'Experiments for friction next'
]
        },
        {
            title: 'Delight sparks',
            theme: 'delight',
            prompts: [
        'Describe how delight shows up for the journey today.',
        'List the voices who can elevate delight right now.',
        'Capture one bold experiment connected to delight.',
        'Note signals that confirm delight is thriving.',
        'Document risks that could erode delight if ignored.',
        'Imagine how delight feels when everything clicks.',
        'Outline partnerships that reinforce delight.',
        'Surface questions still open about delight.',
        'Highlight a customer story that embodies delight.',
        'Define a tiny action that nourishes delight today.',
        'Express gratitude related to delight moments.',
        'Sketch the momentum curve of delight across the week.'
],
            ideas: [
        'We could celebrate delight by amplifying support.',
        'Invite experiment to co-create delight signals.',
        'Prototype a habit that keeps delight visible.',
        'Audit the workflows touching delight moments.',
        'Pair up with experiment to unstick delight blockers.',
        'Share a win around delight with the wider team.',
        'Capture metrics that relate to delight in the dashboard.',
        'Host a five-minute retro on delight mid-week.',
        'Create an inspirational mood board for delight.',
        'Curate a playlist that mirrors the energy of delight.',
        'Draft a short story describing delight success.',
        'Identify one constraint to relax around delight.'
],
            checkpoints: [
        'Confidence in delight today',
        'Support requested for delight',
        'Signals to monitor for delight',
        'Decision pending around delight',
        'Celebration planned for delight',
        'Learning captured about delight',
        'Risk mitigation for delight',
        'Data sources verifying delight',
        'Stakeholders cheering delight',
        'Timeline adjustments affecting delight',
        'Resources to unlock delight',
        'Experiments for delight next'
]
        },
        {
            title: 'Opportunities',
            theme: 'opportunity',
            prompts: [
        'Describe how opportunity shows up for the journey today.',
        'List the voices who can elevate opportunity right now.',
        'Capture one bold experiment connected to opportunity.',
        'Note signals that confirm opportunity is thriving.',
        'Document risks that could erode opportunity if ignored.',
        'Imagine how opportunity feels when everything clicks.',
        'Outline partnerships that reinforce opportunity.',
        'Surface questions still open about opportunity.',
        'Highlight a customer story that embodies opportunity.',
        'Define a tiny action that nourishes opportunity today.',
        'Express gratitude related to opportunity moments.',
        'Sketch the momentum curve of opportunity across the week.'
],
            ideas: [
        'We could celebrate opportunity by amplifying experiment.',
        'Invite stage to co-create opportunity signals.',
        'Prototype a habit that keeps opportunity visible.',
        'Audit the workflows touching opportunity moments.',
        'Pair up with stage to unstick opportunity blockers.',
        'Share a win around opportunity with the wider team.',
        'Capture metrics that relate to opportunity in the dashboard.',
        'Host a five-minute retro on opportunity mid-week.',
        'Create an inspirational mood board for opportunity.',
        'Curate a playlist that mirrors the energy of opportunity.',
        'Draft a short story describing opportunity success.',
        'Identify one constraint to relax around opportunity.'
],
            checkpoints: [
        'Confidence in opportunity today',
        'Support requested for opportunity',
        'Signals to monitor for opportunity',
        'Decision pending around opportunity',
        'Celebration planned for opportunity',
        'Learning captured about opportunity',
        'Risk mitigation for opportunity',
        'Data sources verifying opportunity',
        'Stakeholders cheering opportunity',
        'Timeline adjustments affecting opportunity',
        'Resources to unlock opportunity',
        'Experiments for opportunity next'
]
        },
        {
            title: 'Support allies',
            theme: 'support',
            prompts: [
        'Describe how support shows up for the journey today.',
        'List the voices who can elevate support right now.',
        'Capture one bold experiment connected to support.',
        'Note signals that confirm support is thriving.',
        'Document risks that could erode support if ignored.',
        'Imagine how support feels when everything clicks.',
        'Outline partnerships that reinforce support.',
        'Surface questions still open about support.',
        'Highlight a customer story that embodies support.',
        'Define a tiny action that nourishes support today.',
        'Express gratitude related to support moments.',
        'Sketch the momentum curve of support across the week.'
],
            ideas: [
        'We could celebrate support by amplifying stage.',
        'Invite emotion to co-create support signals.',
        'Prototype a habit that keeps support visible.',
        'Audit the workflows touching support moments.',
        'Pair up with emotion to unstick support blockers.',
        'Share a win around support with the wider team.',
        'Capture metrics that relate to support in the dashboard.',
        'Host a five-minute retro on support mid-week.',
        'Create an inspirational mood board for support.',
        'Curate a playlist that mirrors the energy of support.',
        'Draft a short story describing support success.',
        'Identify one constraint to relax around support.'
],
            checkpoints: [
        'Confidence in support today',
        'Support requested for support',
        'Signals to monitor for support',
        'Decision pending around support',
        'Celebration planned for support',
        'Learning captured about support',
        'Risk mitigation for support',
        'Data sources verifying support',
        'Stakeholders cheering support',
        'Timeline adjustments affecting support',
        'Resources to unlock support',
        'Experiments for support next'
]
        },
        {
            title: 'Next experiments',
            theme: 'experiment',
            prompts: [
        'Describe how experiment shows up for the journey today.',
        'List the voices who can elevate experiment right now.',
        'Capture one bold experiment connected to experiment.',
        'Note signals that confirm experiment is thriving.',
        'Document risks that could erode experiment if ignored.',
        'Imagine how experiment feels when everything clicks.',
        'Outline partnerships that reinforce experiment.',
        'Surface questions still open about experiment.',
        'Highlight a customer story that embodies experiment.',
        'Define a tiny action that nourishes experiment today.',
        'Express gratitude related to experiment moments.',
        'Sketch the momentum curve of experiment across the week.'
],
            ideas: [
        'We could celebrate experiment by amplifying emotion.',
        'Invite question to co-create experiment signals.',
        'Prototype a habit that keeps experiment visible.',
        'Audit the workflows touching experiment moments.',
        'Pair up with question to unstick experiment blockers.',
        'Share a win around experiment with the wider team.',
        'Capture metrics that relate to experiment in the dashboard.',
        'Host a five-minute retro on experiment mid-week.',
        'Create an inspirational mood board for experiment.',
        'Curate a playlist that mirrors the energy of experiment.',
        'Draft a short story describing experiment success.',
        'Identify one constraint to relax around experiment.'
],
            checkpoints: [
        'Confidence in experiment today',
        'Support requested for experiment',
        'Signals to monitor for experiment',
        'Decision pending around experiment',
        'Celebration planned for experiment',
        'Learning captured about experiment',
        'Risk mitigation for experiment',
        'Data sources verifying experiment',
        'Stakeholders cheering experiment',
        'Timeline adjustments affecting experiment',
        'Resources to unlock experiment',
        'Experiments for experiment next'
]
        }
],
        affirmations: [
        'We protect momentum even when things wobble.',
        'Curiosity fuels every iteration we attempt.',
        'We celebrate micro-wins loudly and often.',
        'Humans first, then process, then tooling.',
        'We learn faster together than alone.',
        'Every obstacle carries a hidden insight.',
        'Joy and rigor can absolutely coexist.',
        'We narrate progress so others feel invited.',
        'Pauses are an intentional productivity move.',
        'We choose clarity over speed when needed.',
        'Listening deeply is our superpower.',
        'We prioritise kindness without losing edge.',
        'Celebration is a strategy, not an afterthought.',
        'Asking better questions unlocks better answers.',
        'We leave room for surprise and delight.',
        'Tiny experiments accumulate into bold impact.',
        'Documenting context keeps the future grateful.',
        'We signal progress with warmth and precision.',
        'Reflection is the bridge between today and tomorrow.',
        'We craft experiences that feel like a conversation.',
        'We choose stage storyline',
        'We choose stage highlight',
        'We choose stage question',
        'We choose stage invitation',
        'We choose stage experiment',
        'We choose emotion storyline',
        'We choose emotion highlight',
        'We choose emotion question',
        'We choose emotion invitation',
        'We choose emotion experiment',
        'We choose question storyline',
        'We choose question highlight',
        'We choose question question',
        'We choose question invitation',
        'We choose question experiment',
        'We choose friction storyline',
        'We choose friction highlight',
        'We choose friction question',
        'We choose friction invitation',
        'We choose friction experiment',
        'We choose delight storyline',
        'We choose delight highlight',
        'We choose delight question',
        'We choose delight invitation',
        'We choose delight experiment',
        'We choose opportunity storyline',
        'We choose opportunity highlight',
        'We choose opportunity question',
        'We choose opportunity invitation',
        'We choose opportunity experiment',
        'We choose support storyline',
        'We choose support highlight',
        'We choose support question',
        'We choose support invitation',
        'We choose support experiment',
        'We choose experiment storyline',
        'We choose experiment highlight',
        'We choose experiment question',
        'We choose experiment invitation',
        'We choose experiment experiment'
],
        defaultConfig: {
    title: 'Customer journey sketchbook',
    tone: 'empathetic',
    sections: 'Stage snapshot,Emotion timeline,Questions bubbling,Moments of friction',
    includeReflection: true,
    customHighlights: ''
},
        form: [
        {
            key: 'title',
            label: 'Template title',
            type: 'text',
            placeholder: 'Customer journey sketchbook'
        },
        {
            key: 'tone',
            label: 'Tone',
            type: 'select',
            options: [
        {
            value: 'empathetic',
            label: 'Empathetic'
        },
        {
            value: 'adventurous',
            label: 'Adventurous'
        },
        {
            value: 'curious',
            label: 'Curious'
        },
        {
            value: 'detailed',
            label: 'Detailed'
        },
        {
            value: 'playful',
            label: 'Playful'
        }
]
        },
        {
            key: 'sections',
            label: 'Sections to include',
            type: 'textarea',
            rows: 3,
            placeholder: 'Stage snapshot,Emotion timeline,Questions bubbling,Moments of friction'
        },
        {
            key: 'includeReflection',
            label: 'Add reflection prompts',
            type: 'checkbox'
        },
        {
            key: 'customHighlights',
            label: 'Custom highlights',
            type: 'textarea',
            rows: 3,
            placeholder: 'Wins to celebrate'
        }
]
    },
    {
        id: 'extended-trigger-learning-diary',
        category: 'trigger',
        name: 'Learning diary curator',
        description: 'Capture learning moments, aha reactions, and practice commitments.',
        icon: 'book-open',
        accent: '#14b8a6',
        tags: [
        'template',
        'growth',
        'reflection',
        'trigger'
],
        mode: 'template',
        topic: 'the learning',
        tones: [
        'curious',
        'gentle',
        'bold',
        'analytical',
        'playful'
],
        sections: [
        {
            title: 'Learning spark',
            theme: 'spark',
            prompts: [
        'Describe how spark shows up for the learning today.',
        'List the voices who can elevate spark right now.',
        'Capture one bold experiment connected to spark.',
        'Note signals that confirm spark is thriving.',
        'Document risks that could erode spark if ignored.',
        'Imagine how spark feels when everything clicks.',
        'Outline partnerships that reinforce spark.',
        'Surface questions still open about spark.',
        'Highlight a customer story that embodies spark.',
        'Define a tiny action that nourishes spark today.',
        'Express gratitude related to spark moments.',
        'Sketch the momentum curve of spark across the week.'
],
            ideas: [
        'We could celebrate spark by amplifying shift.',
        'Invite skill to co-create spark signals.',
        'Prototype a habit that keeps spark visible.',
        'Audit the workflows touching spark moments.',
        'Pair up with skill to unstick spark blockers.',
        'Share a win around spark with the wider team.',
        'Capture metrics that relate to spark in the dashboard.',
        'Host a five-minute retro on spark mid-week.',
        'Create an inspirational mood board for spark.',
        'Curate a playlist that mirrors the energy of spark.',
        'Draft a short story describing spark success.',
        'Identify one constraint to relax around spark.'
],
            checkpoints: [
        'Confidence in spark today',
        'Support requested for spark',
        'Signals to monitor for spark',
        'Decision pending around spark',
        'Celebration planned for spark',
        'Learning captured about spark',
        'Risk mitigation for spark',
        'Data sources verifying spark',
        'Stakeholders cheering spark',
        'Timeline adjustments affecting spark',
        'Resources to unlock spark',
        'Experiments for spark next'
]
        },
        {
            title: 'How it felt',
            theme: 'emotion',
            prompts: [
        'Describe how emotion shows up for the learning today.',
        'List the voices who can elevate emotion right now.',
        'Capture one bold experiment connected to emotion.',
        'Note signals that confirm emotion is thriving.',
        'Document risks that could erode emotion if ignored.',
        'Imagine how emotion feels when everything clicks.',
        'Outline partnerships that reinforce emotion.',
        'Surface questions still open about emotion.',
        'Highlight a customer story that embodies emotion.',
        'Define a tiny action that nourishes emotion today.',
        'Express gratitude related to emotion moments.',
        'Sketch the momentum curve of emotion across the week.'
],
            ideas: [
        'We could celebrate emotion by amplifying skill.',
        'Invite gratitude to co-create emotion signals.',
        'Prototype a habit that keeps emotion visible.',
        'Audit the workflows touching emotion moments.',
        'Pair up with gratitude to unstick emotion blockers.',
        'Share a win around emotion with the wider team.',
        'Capture metrics that relate to emotion in the dashboard.',
        'Host a five-minute retro on emotion mid-week.',
        'Create an inspirational mood board for emotion.',
        'Curate a playlist that mirrors the energy of emotion.',
        'Draft a short story describing emotion success.',
        'Identify one constraint to relax around emotion.'
],
            checkpoints: [
        'Confidence in emotion today',
        'Support requested for emotion',
        'Signals to monitor for emotion',
        'Decision pending around emotion',
        'Celebration planned for emotion',
        'Learning captured about emotion',
        'Risk mitigation for emotion',
        'Data sources verifying emotion',
        'Stakeholders cheering emotion',
        'Timeline adjustments affecting emotion',
        'Resources to unlock emotion',
        'Experiments for emotion next'
]
        },
        {
            title: 'What shifted',
            theme: 'shift',
            prompts: [
        'Describe how shift shows up for the learning today.',
        'List the voices who can elevate shift right now.',
        'Capture one bold experiment connected to shift.',
        'Note signals that confirm shift is thriving.',
        'Document risks that could erode shift if ignored.',
        'Imagine how shift feels when everything clicks.',
        'Outline partnerships that reinforce shift.',
        'Surface questions still open about shift.',
        'Highlight a customer story that embodies shift.',
        'Define a tiny action that nourishes shift today.',
        'Express gratitude related to shift moments.',
        'Sketch the momentum curve of shift across the week.'
],
            ideas: [
        'We could celebrate shift by amplifying gratitude.',
        'Invite resource to co-create shift signals.',
        'Prototype a habit that keeps shift visible.',
        'Audit the workflows touching shift moments.',
        'Pair up with resource to unstick shift blockers.',
        'Share a win around shift with the wider team.',
        'Capture metrics that relate to shift in the dashboard.',
        'Host a five-minute retro on shift mid-week.',
        'Create an inspirational mood board for shift.',
        'Curate a playlist that mirrors the energy of shift.',
        'Draft a short story describing shift success.',
        'Identify one constraint to relax around shift.'
],
            checkpoints: [
        'Confidence in shift today',
        'Support requested for shift',
        'Signals to monitor for shift',
        'Decision pending around shift',
        'Celebration planned for shift',
        'Learning captured about shift',
        'Risk mitigation for shift',
        'Data sources verifying shift',
        'Stakeholders cheering shift',
        'Timeline adjustments affecting shift',
        'Resources to unlock shift',
        'Experiments for shift next'
]
        },
        {
            title: 'Skills to rehearse',
            theme: 'skill',
            prompts: [
        'Describe how skill shows up for the learning today.',
        'List the voices who can elevate skill right now.',
        'Capture one bold experiment connected to skill.',
        'Note signals that confirm skill is thriving.',
        'Document risks that could erode skill if ignored.',
        'Imagine how skill feels when everything clicks.',
        'Outline partnerships that reinforce skill.',
        'Surface questions still open about skill.',
        'Highlight a customer story that embodies skill.',
        'Define a tiny action that nourishes skill today.',
        'Express gratitude related to skill moments.',
        'Sketch the momentum curve of skill across the week.'
],
            ideas: [
        'We could celebrate skill by amplifying resource.',
        'Invite experiment to co-create skill signals.',
        'Prototype a habit that keeps skill visible.',
        'Audit the workflows touching skill moments.',
        'Pair up with experiment to unstick skill blockers.',
        'Share a win around skill with the wider team.',
        'Capture metrics that relate to skill in the dashboard.',
        'Host a five-minute retro on skill mid-week.',
        'Create an inspirational mood board for skill.',
        'Curate a playlist that mirrors the energy of skill.',
        'Draft a short story describing skill success.',
        'Identify one constraint to relax around skill.'
],
            checkpoints: [
        'Confidence in skill today',
        'Support requested for skill',
        'Signals to monitor for skill',
        'Decision pending around skill',
        'Celebration planned for skill',
        'Learning captured about skill',
        'Risk mitigation for skill',
        'Data sources verifying skill',
        'Stakeholders cheering skill',
        'Timeline adjustments affecting skill',
        'Resources to unlock skill',
        'Experiments for skill next'
]
        },
        {
            title: 'People to thank',
            theme: 'gratitude',
            prompts: [
        'Describe how gratitude shows up for the learning today.',
        'List the voices who can elevate gratitude right now.',
        'Capture one bold experiment connected to gratitude.',
        'Note signals that confirm gratitude is thriving.',
        'Document risks that could erode gratitude if ignored.',
        'Imagine how gratitude feels when everything clicks.',
        'Outline partnerships that reinforce gratitude.',
        'Surface questions still open about gratitude.',
        'Highlight a customer story that embodies gratitude.',
        'Define a tiny action that nourishes gratitude today.',
        'Express gratitude related to gratitude moments.',
        'Sketch the momentum curve of gratitude across the week.'
],
            ideas: [
        'We could celebrate gratitude by amplifying experiment.',
        'Invite curiosity to co-create gratitude signals.',
        'Prototype a habit that keeps gratitude visible.',
        'Audit the workflows touching gratitude moments.',
        'Pair up with curiosity to unstick gratitude blockers.',
        'Share a win around gratitude with the wider team.',
        'Capture metrics that relate to gratitude in the dashboard.',
        'Host a five-minute retro on gratitude mid-week.',
        'Create an inspirational mood board for gratitude.',
        'Curate a playlist that mirrors the energy of gratitude.',
        'Draft a short story describing gratitude success.',
        'Identify one constraint to relax around gratitude.'
],
            checkpoints: [
        'Confidence in gratitude today',
        'Support requested for gratitude',
        'Signals to monitor for gratitude',
        'Decision pending around gratitude',
        'Celebration planned for gratitude',
        'Learning captured about gratitude',
        'Risk mitigation for gratitude',
        'Data sources verifying gratitude',
        'Stakeholders cheering gratitude',
        'Timeline adjustments affecting gratitude',
        'Resources to unlock gratitude',
        'Experiments for gratitude next'
]
        },
        {
            title: 'Resources to revisit',
            theme: 'resource',
            prompts: [
        'Describe how resource shows up for the learning today.',
        'List the voices who can elevate resource right now.',
        'Capture one bold experiment connected to resource.',
        'Note signals that confirm resource is thriving.',
        'Document risks that could erode resource if ignored.',
        'Imagine how resource feels when everything clicks.',
        'Outline partnerships that reinforce resource.',
        'Surface questions still open about resource.',
        'Highlight a customer story that embodies resource.',
        'Define a tiny action that nourishes resource today.',
        'Express gratitude related to resource moments.',
        'Sketch the momentum curve of resource across the week.'
],
            ideas: [
        'We could celebrate resource by amplifying curiosity.',
        'Invite spark to co-create resource signals.',
        'Prototype a habit that keeps resource visible.',
        'Audit the workflows touching resource moments.',
        'Pair up with spark to unstick resource blockers.',
        'Share a win around resource with the wider team.',
        'Capture metrics that relate to resource in the dashboard.',
        'Host a five-minute retro on resource mid-week.',
        'Create an inspirational mood board for resource.',
        'Curate a playlist that mirrors the energy of resource.',
        'Draft a short story describing resource success.',
        'Identify one constraint to relax around resource.'
],
            checkpoints: [
        'Confidence in resource today',
        'Support requested for resource',
        'Signals to monitor for resource',
        'Decision pending around resource',
        'Celebration planned for resource',
        'Learning captured about resource',
        'Risk mitigation for resource',
        'Data sources verifying resource',
        'Stakeholders cheering resource',
        'Timeline adjustments affecting resource',
        'Resources to unlock resource',
        'Experiments for resource next'
]
        },
        {
            title: 'Micro experiments',
            theme: 'experiment',
            prompts: [
        'Describe how experiment shows up for the learning today.',
        'List the voices who can elevate experiment right now.',
        'Capture one bold experiment connected to experiment.',
        'Note signals that confirm experiment is thriving.',
        'Document risks that could erode experiment if ignored.',
        'Imagine how experiment feels when everything clicks.',
        'Outline partnerships that reinforce experiment.',
        'Surface questions still open about experiment.',
        'Highlight a customer story that embodies experiment.',
        'Define a tiny action that nourishes experiment today.',
        'Express gratitude related to experiment moments.',
        'Sketch the momentum curve of experiment across the week.'
],
            ideas: [
        'We could celebrate experiment by amplifying spark.',
        'Invite emotion to co-create experiment signals.',
        'Prototype a habit that keeps experiment visible.',
        'Audit the workflows touching experiment moments.',
        'Pair up with emotion to unstick experiment blockers.',
        'Share a win around experiment with the wider team.',
        'Capture metrics that relate to experiment in the dashboard.',
        'Host a five-minute retro on experiment mid-week.',
        'Create an inspirational mood board for experiment.',
        'Curate a playlist that mirrors the energy of experiment.',
        'Draft a short story describing experiment success.',
        'Identify one constraint to relax around experiment.'
],
            checkpoints: [
        'Confidence in experiment today',
        'Support requested for experiment',
        'Signals to monitor for experiment',
        'Decision pending around experiment',
        'Celebration planned for experiment',
        'Learning captured about experiment',
        'Risk mitigation for experiment',
        'Data sources verifying experiment',
        'Stakeholders cheering experiment',
        'Timeline adjustments affecting experiment',
        'Resources to unlock experiment',
        'Experiments for experiment next'
]
        },
        {
            title: 'Next curious steps',
            theme: 'curiosity',
            prompts: [
        'Describe how curiosity shows up for the learning today.',
        'List the voices who can elevate curiosity right now.',
        'Capture one bold experiment connected to curiosity.',
        'Note signals that confirm curiosity is thriving.',
        'Document risks that could erode curiosity if ignored.',
        'Imagine how curiosity feels when everything clicks.',
        'Outline partnerships that reinforce curiosity.',
        'Surface questions still open about curiosity.',
        'Highlight a customer story that embodies curiosity.',
        'Define a tiny action that nourishes curiosity today.',
        'Express gratitude related to curiosity moments.',
        'Sketch the momentum curve of curiosity across the week.'
],
            ideas: [
        'We could celebrate curiosity by amplifying emotion.',
        'Invite shift to co-create curiosity signals.',
        'Prototype a habit that keeps curiosity visible.',
        'Audit the workflows touching curiosity moments.',
        'Pair up with shift to unstick curiosity blockers.',
        'Share a win around curiosity with the wider team.',
        'Capture metrics that relate to curiosity in the dashboard.',
        'Host a five-minute retro on curiosity mid-week.',
        'Create an inspirational mood board for curiosity.',
        'Curate a playlist that mirrors the energy of curiosity.',
        'Draft a short story describing curiosity success.',
        'Identify one constraint to relax around curiosity.'
],
            checkpoints: [
        'Confidence in curiosity today',
        'Support requested for curiosity',
        'Signals to monitor for curiosity',
        'Decision pending around curiosity',
        'Celebration planned for curiosity',
        'Learning captured about curiosity',
        'Risk mitigation for curiosity',
        'Data sources verifying curiosity',
        'Stakeholders cheering curiosity',
        'Timeline adjustments affecting curiosity',
        'Resources to unlock curiosity',
        'Experiments for curiosity next'
]
        }
],
        affirmations: [
        'We protect momentum even when things wobble.',
        'Curiosity fuels every iteration we attempt.',
        'We celebrate micro-wins loudly and often.',
        'Humans first, then process, then tooling.',
        'We learn faster together than alone.',
        'Every obstacle carries a hidden insight.',
        'Joy and rigor can absolutely coexist.',
        'We narrate progress so others feel invited.',
        'Pauses are an intentional productivity move.',
        'We choose clarity over speed when needed.',
        'Listening deeply is our superpower.',
        'We prioritise kindness without losing edge.',
        'Celebration is a strategy, not an afterthought.',
        'Asking better questions unlocks better answers.',
        'We leave room for surprise and delight.',
        'Tiny experiments accumulate into bold impact.',
        'Documenting context keeps the future grateful.',
        'We signal progress with warmth and precision.',
        'Reflection is the bridge between today and tomorrow.',
        'We craft experiences that feel like a conversation.',
        'We choose spark storyline',
        'We choose spark highlight',
        'We choose spark question',
        'We choose spark invitation',
        'We choose spark experiment',
        'We choose emotion storyline',
        'We choose emotion highlight',
        'We choose emotion question',
        'We choose emotion invitation',
        'We choose emotion experiment',
        'We choose shift storyline',
        'We choose shift highlight',
        'We choose shift question',
        'We choose shift invitation',
        'We choose shift experiment',
        'We choose skill storyline',
        'We choose skill highlight',
        'We choose skill question',
        'We choose skill invitation',
        'We choose skill experiment',
        'We choose gratitude storyline',
        'We choose gratitude highlight',
        'We choose gratitude question',
        'We choose gratitude invitation',
        'We choose gratitude experiment',
        'We choose resource storyline',
        'We choose resource highlight',
        'We choose resource question',
        'We choose resource invitation',
        'We choose resource experiment',
        'We choose experiment storyline',
        'We choose experiment highlight',
        'We choose experiment question',
        'We choose experiment invitation',
        'We choose experiment experiment',
        'We choose curiosity storyline',
        'We choose curiosity highlight',
        'We choose curiosity question',
        'We choose curiosity invitation',
        'We choose curiosity experiment'
],
        defaultConfig: {
    title: 'Learning diary curator',
    tone: 'curious',
    sections: 'Learning spark,How it felt,What shifted,Skills to rehearse',
    includeReflection: true,
    customHighlights: ''
},
        form: [
        {
            key: 'title',
            label: 'Template title',
            type: 'text',
            placeholder: 'Learning diary curator'
        },
        {
            key: 'tone',
            label: 'Tone',
            type: 'select',
            options: [
        {
            value: 'curious',
            label: 'Curious'
        },
        {
            value: 'gentle',
            label: 'Gentle'
        },
        {
            value: 'bold',
            label: 'Bold'
        },
        {
            value: 'analytical',
            label: 'Analytical'
        },
        {
            value: 'playful',
            label: 'Playful'
        }
]
        },
        {
            key: 'sections',
            label: 'Sections to include',
            type: 'textarea',
            rows: 3,
            placeholder: 'Learning spark,How it felt,What shifted,Skills to rehearse'
        },
        {
            key: 'includeReflection',
            label: 'Add reflection prompts',
            type: 'checkbox'
        },
        {
            key: 'customHighlights',
            label: 'Custom highlights',
            type: 'textarea',
            rows: 3,
            placeholder: 'Wins to celebrate'
        }
]
    },
    {
        id: 'extended-trigger-experiment-canvas',
        category: 'trigger',
        name: 'Experiment canvas architect',
        description: 'Frame experiments with hypotheses, guardrails, and measurement rhythms.',
        icon: 'beaker',
        accent: '#fb7185',
        tags: [
        'template',
        'research',
        'innovation',
        'trigger'
],
        mode: 'template',
        topic: 'the experiment',
        tones: [
        'bold',
        'scientific',
        'playful',
        'disciplined',
        'optimistic'
],
        sections: [
        {
            title: 'Hypothesis',
            theme: 'hypothesis',
            prompts: [
        'Describe how hypothesis shows up for the experiment today.',
        'List the voices who can elevate hypothesis right now.',
        'Capture one bold experiment connected to hypothesis.',
        'Note signals that confirm hypothesis is thriving.',
        'Document risks that could erode hypothesis if ignored.',
        'Imagine how hypothesis feels when everything clicks.',
        'Outline partnerships that reinforce hypothesis.',
        'Surface questions still open about hypothesis.',
        'Highlight a customer story that embodies hypothesis.',
        'Define a tiny action that nourishes hypothesis today.',
        'Express gratitude related to hypothesis moments.',
        'Sketch the momentum curve of hypothesis across the week.'
],
            ideas: [
        'We could celebrate hypothesis by amplifying guardrail.',
        'Invite success to co-create hypothesis signals.',
        'Prototype a habit that keeps hypothesis visible.',
        'Audit the workflows touching hypothesis moments.',
        'Pair up with success to unstick hypothesis blockers.',
        'Share a win around hypothesis with the wider team.',
        'Capture metrics that relate to hypothesis in the dashboard.',
        'Host a five-minute retro on hypothesis mid-week.',
        'Create an inspirational mood board for hypothesis.',
        'Curate a playlist that mirrors the energy of hypothesis.',
        'Draft a short story describing hypothesis success.',
        'Identify one constraint to relax around hypothesis.'
],
            checkpoints: [
        'Confidence in hypothesis today',
        'Support requested for hypothesis',
        'Signals to monitor for hypothesis',
        'Decision pending around hypothesis',
        'Celebration planned for hypothesis',
        'Learning captured about hypothesis',
        'Risk mitigation for hypothesis',
        'Data sources verifying hypothesis',
        'Stakeholders cheering hypothesis',
        'Timeline adjustments affecting hypothesis',
        'Resources to unlock hypothesis',
        'Experiments for hypothesis next'
]
        },
        {
            title: 'Why now',
            theme: 'timing',
            prompts: [
        'Describe how timing shows up for the experiment today.',
        'List the voices who can elevate timing right now.',
        'Capture one bold experiment connected to timing.',
        'Note signals that confirm timing is thriving.',
        'Document risks that could erode timing if ignored.',
        'Imagine how timing feels when everything clicks.',
        'Outline partnerships that reinforce timing.',
        'Surface questions still open about timing.',
        'Highlight a customer story that embodies timing.',
        'Define a tiny action that nourishes timing today.',
        'Express gratitude related to timing moments.',
        'Sketch the momentum curve of timing across the week.'
],
            ideas: [
        'We could celebrate timing by amplifying success.',
        'Invite signal to co-create timing signals.',
        'Prototype a habit that keeps timing visible.',
        'Audit the workflows touching timing moments.',
        'Pair up with signal to unstick timing blockers.',
        'Share a win around timing with the wider team.',
        'Capture metrics that relate to timing in the dashboard.',
        'Host a five-minute retro on timing mid-week.',
        'Create an inspirational mood board for timing.',
        'Curate a playlist that mirrors the energy of timing.',
        'Draft a short story describing timing success.',
        'Identify one constraint to relax around timing.'
],
            checkpoints: [
        'Confidence in timing today',
        'Support requested for timing',
        'Signals to monitor for timing',
        'Decision pending around timing',
        'Celebration planned for timing',
        'Learning captured about timing',
        'Risk mitigation for timing',
        'Data sources verifying timing',
        'Stakeholders cheering timing',
        'Timeline adjustments affecting timing',
        'Resources to unlock timing',
        'Experiments for timing next'
]
        },
        {
            title: 'Guardrails',
            theme: 'guardrail',
            prompts: [
        'Describe how guardrail shows up for the experiment today.',
        'List the voices who can elevate guardrail right now.',
        'Capture one bold experiment connected to guardrail.',
        'Note signals that confirm guardrail is thriving.',
        'Document risks that could erode guardrail if ignored.',
        'Imagine how guardrail feels when everything clicks.',
        'Outline partnerships that reinforce guardrail.',
        'Surface questions still open about guardrail.',
        'Highlight a customer story that embodies guardrail.',
        'Define a tiny action that nourishes guardrail today.',
        'Express gratitude related to guardrail moments.',
        'Sketch the momentum curve of guardrail across the week.'
],
            ideas: [
        'We could celebrate guardrail by amplifying signal.',
        'Invite resource to co-create guardrail signals.',
        'Prototype a habit that keeps guardrail visible.',
        'Audit the workflows touching guardrail moments.',
        'Pair up with resource to unstick guardrail blockers.',
        'Share a win around guardrail with the wider team.',
        'Capture metrics that relate to guardrail in the dashboard.',
        'Host a five-minute retro on guardrail mid-week.',
        'Create an inspirational mood board for guardrail.',
        'Curate a playlist that mirrors the energy of guardrail.',
        'Draft a short story describing guardrail success.',
        'Identify one constraint to relax around guardrail.'
],
            checkpoints: [
        'Confidence in guardrail today',
        'Support requested for guardrail',
        'Signals to monitor for guardrail',
        'Decision pending around guardrail',
        'Celebration planned for guardrail',
        'Learning captured about guardrail',
        'Risk mitigation for guardrail',
        'Data sources verifying guardrail',
        'Stakeholders cheering guardrail',
        'Timeline adjustments affecting guardrail',
        'Resources to unlock guardrail',
        'Experiments for guardrail next'
]
        },
        {
            title: 'Success metric',
            theme: 'success',
            prompts: [
        'Describe how success shows up for the experiment today.',
        'List the voices who can elevate success right now.',
        'Capture one bold experiment connected to success.',
        'Note signals that confirm success is thriving.',
        'Document risks that could erode success if ignored.',
        'Imagine how success feels when everything clicks.',
        'Outline partnerships that reinforce success.',
        'Surface questions still open about success.',
        'Highlight a customer story that embodies success.',
        'Define a tiny action that nourishes success today.',
        'Express gratitude related to success moments.',
        'Sketch the momentum curve of success across the week.'
],
            ideas: [
        'We could celebrate success by amplifying resource.',
        'Invite launch to co-create success signals.',
        'Prototype a habit that keeps success visible.',
        'Audit the workflows touching success moments.',
        'Pair up with launch to unstick success blockers.',
        'Share a win around success with the wider team.',
        'Capture metrics that relate to success in the dashboard.',
        'Host a five-minute retro on success mid-week.',
        'Create an inspirational mood board for success.',
        'Curate a playlist that mirrors the energy of success.',
        'Draft a short story describing success success.',
        'Identify one constraint to relax around success.'
],
            checkpoints: [
        'Confidence in success today',
        'Support requested for success',
        'Signals to monitor for success',
        'Decision pending around success',
        'Celebration planned for success',
        'Learning captured about success',
        'Risk mitigation for success',
        'Data sources verifying success',
        'Stakeholders cheering success',
        'Timeline adjustments affecting success',
        'Resources to unlock success',
        'Experiments for success next'
]
        },
        {
            title: 'Failure tells',
            theme: 'signal',
            prompts: [
        'Describe how signal shows up for the experiment today.',
        'List the voices who can elevate signal right now.',
        'Capture one bold experiment connected to signal.',
        'Note signals that confirm signal is thriving.',
        'Document risks that could erode signal if ignored.',
        'Imagine how signal feels when everything clicks.',
        'Outline partnerships that reinforce signal.',
        'Surface questions still open about signal.',
        'Highlight a customer story that embodies signal.',
        'Define a tiny action that nourishes signal today.',
        'Express gratitude related to signal moments.',
        'Sketch the momentum curve of signal across the week.'
],
            ideas: [
        'We could celebrate signal by amplifying launch.',
        'Invite cadence to co-create signal signals.',
        'Prototype a habit that keeps signal visible.',
        'Audit the workflows touching signal moments.',
        'Pair up with cadence to unstick signal blockers.',
        'Share a win around signal with the wider team.',
        'Capture metrics that relate to signal in the dashboard.',
        'Host a five-minute retro on signal mid-week.',
        'Create an inspirational mood board for signal.',
        'Curate a playlist that mirrors the energy of signal.',
        'Draft a short story describing signal success.',
        'Identify one constraint to relax around signal.'
],
            checkpoints: [
        'Confidence in signal today',
        'Support requested for signal',
        'Signals to monitor for signal',
        'Decision pending around signal',
        'Celebration planned for signal',
        'Learning captured about signal',
        'Risk mitigation for signal',
        'Data sources verifying signal',
        'Stakeholders cheering signal',
        'Timeline adjustments affecting signal',
        'Resources to unlock signal',
        'Experiments for signal next'
]
        },
        {
            title: 'Resources',
            theme: 'resource',
            prompts: [
        'Describe how resource shows up for the experiment today.',
        'List the voices who can elevate resource right now.',
        'Capture one bold experiment connected to resource.',
        'Note signals that confirm resource is thriving.',
        'Document risks that could erode resource if ignored.',
        'Imagine how resource feels when everything clicks.',
        'Outline partnerships that reinforce resource.',
        'Surface questions still open about resource.',
        'Highlight a customer story that embodies resource.',
        'Define a tiny action that nourishes resource today.',
        'Express gratitude related to resource moments.',
        'Sketch the momentum curve of resource across the week.'
],
            ideas: [
        'We could celebrate resource by amplifying cadence.',
        'Invite hypothesis to co-create resource signals.',
        'Prototype a habit that keeps resource visible.',
        'Audit the workflows touching resource moments.',
        'Pair up with hypothesis to unstick resource blockers.',
        'Share a win around resource with the wider team.',
        'Capture metrics that relate to resource in the dashboard.',
        'Host a five-minute retro on resource mid-week.',
        'Create an inspirational mood board for resource.',
        'Curate a playlist that mirrors the energy of resource.',
        'Draft a short story describing resource success.',
        'Identify one constraint to relax around resource.'
],
            checkpoints: [
        'Confidence in resource today',
        'Support requested for resource',
        'Signals to monitor for resource',
        'Decision pending around resource',
        'Celebration planned for resource',
        'Learning captured about resource',
        'Risk mitigation for resource',
        'Data sources verifying resource',
        'Stakeholders cheering resource',
        'Timeline adjustments affecting resource',
        'Resources to unlock resource',
        'Experiments for resource next'
]
        },
        {
            title: 'Launch steps',
            theme: 'launch',
            prompts: [
        'Describe how launch shows up for the experiment today.',
        'List the voices who can elevate launch right now.',
        'Capture one bold experiment connected to launch.',
        'Note signals that confirm launch is thriving.',
        'Document risks that could erode launch if ignored.',
        'Imagine how launch feels when everything clicks.',
        'Outline partnerships that reinforce launch.',
        'Surface questions still open about launch.',
        'Highlight a customer story that embodies launch.',
        'Define a tiny action that nourishes launch today.',
        'Express gratitude related to launch moments.',
        'Sketch the momentum curve of launch across the week.'
],
            ideas: [
        'We could celebrate launch by amplifying hypothesis.',
        'Invite timing to co-create launch signals.',
        'Prototype a habit that keeps launch visible.',
        'Audit the workflows touching launch moments.',
        'Pair up with timing to unstick launch blockers.',
        'Share a win around launch with the wider team.',
        'Capture metrics that relate to launch in the dashboard.',
        'Host a five-minute retro on launch mid-week.',
        'Create an inspirational mood board for launch.',
        'Curate a playlist that mirrors the energy of launch.',
        'Draft a short story describing launch success.',
        'Identify one constraint to relax around launch.'
],
            checkpoints: [
        'Confidence in launch today',
        'Support requested for launch',
        'Signals to monitor for launch',
        'Decision pending around launch',
        'Celebration planned for launch',
        'Learning captured about launch',
        'Risk mitigation for launch',
        'Data sources verifying launch',
        'Stakeholders cheering launch',
        'Timeline adjustments affecting launch',
        'Resources to unlock launch',
        'Experiments for launch next'
]
        },
        {
            title: 'Review cadence',
            theme: 'cadence',
            prompts: [
        'Describe how cadence shows up for the experiment today.',
        'List the voices who can elevate cadence right now.',
        'Capture one bold experiment connected to cadence.',
        'Note signals that confirm cadence is thriving.',
        'Document risks that could erode cadence if ignored.',
        'Imagine how cadence feels when everything clicks.',
        'Outline partnerships that reinforce cadence.',
        'Surface questions still open about cadence.',
        'Highlight a customer story that embodies cadence.',
        'Define a tiny action that nourishes cadence today.',
        'Express gratitude related to cadence moments.',
        'Sketch the momentum curve of cadence across the week.'
],
            ideas: [
        'We could celebrate cadence by amplifying timing.',
        'Invite guardrail to co-create cadence signals.',
        'Prototype a habit that keeps cadence visible.',
        'Audit the workflows touching cadence moments.',
        'Pair up with guardrail to unstick cadence blockers.',
        'Share a win around cadence with the wider team.',
        'Capture metrics that relate to cadence in the dashboard.',
        'Host a five-minute retro on cadence mid-week.',
        'Create an inspirational mood board for cadence.',
        'Curate a playlist that mirrors the energy of cadence.',
        'Draft a short story describing cadence success.',
        'Identify one constraint to relax around cadence.'
],
            checkpoints: [
        'Confidence in cadence today',
        'Support requested for cadence',
        'Signals to monitor for cadence',
        'Decision pending around cadence',
        'Celebration planned for cadence',
        'Learning captured about cadence',
        'Risk mitigation for cadence',
        'Data sources verifying cadence',
        'Stakeholders cheering cadence',
        'Timeline adjustments affecting cadence',
        'Resources to unlock cadence',
        'Experiments for cadence next'
]
        }
],
        affirmations: [
        'We protect momentum even when things wobble.',
        'Curiosity fuels every iteration we attempt.',
        'We celebrate micro-wins loudly and often.',
        'Humans first, then process, then tooling.',
        'We learn faster together than alone.',
        'Every obstacle carries a hidden insight.',
        'Joy and rigor can absolutely coexist.',
        'We narrate progress so others feel invited.',
        'Pauses are an intentional productivity move.',
        'We choose clarity over speed when needed.',
        'Listening deeply is our superpower.',
        'We prioritise kindness without losing edge.',
        'Celebration is a strategy, not an afterthought.',
        'Asking better questions unlocks better answers.',
        'We leave room for surprise and delight.',
        'Tiny experiments accumulate into bold impact.',
        'Documenting context keeps the future grateful.',
        'We signal progress with warmth and precision.',
        'Reflection is the bridge between today and tomorrow.',
        'We craft experiences that feel like a conversation.',
        'We choose hypothesis storyline',
        'We choose hypothesis highlight',
        'We choose hypothesis question',
        'We choose hypothesis invitation',
        'We choose hypothesis experiment',
        'We choose timing storyline',
        'We choose timing highlight',
        'We choose timing question',
        'We choose timing invitation',
        'We choose timing experiment',
        'We choose guardrail storyline',
        'We choose guardrail highlight',
        'We choose guardrail question',
        'We choose guardrail invitation',
        'We choose guardrail experiment',
        'We choose success storyline',
        'We choose success highlight',
        'We choose success question',
        'We choose success invitation',
        'We choose success experiment',
        'We choose signal storyline',
        'We choose signal highlight',
        'We choose signal question',
        'We choose signal invitation',
        'We choose signal experiment',
        'We choose resource storyline',
        'We choose resource highlight',
        'We choose resource question',
        'We choose resource invitation',
        'We choose resource experiment',
        'We choose launch storyline',
        'We choose launch highlight',
        'We choose launch question',
        'We choose launch invitation',
        'We choose launch experiment',
        'We choose cadence storyline',
        'We choose cadence highlight',
        'We choose cadence question',
        'We choose cadence invitation',
        'We choose cadence experiment'
],
        defaultConfig: {
    title: 'Experiment canvas architect',
    tone: 'bold',
    sections: 'Hypothesis,Why now,Guardrails,Success metric',
    includeReflection: true,
    customHighlights: ''
},
        form: [
        {
            key: 'title',
            label: 'Template title',
            type: 'text',
            placeholder: 'Experiment canvas architect'
        },
        {
            key: 'tone',
            label: 'Tone',
            type: 'select',
            options: [
        {
            value: 'bold',
            label: 'Bold'
        },
        {
            value: 'scientific',
            label: 'Scientific'
        },
        {
            value: 'playful',
            label: 'Playful'
        },
        {
            value: 'disciplined',
            label: 'Disciplined'
        },
        {
            value: 'optimistic',
            label: 'Optimistic'
        }
]
        },
        {
            key: 'sections',
            label: 'Sections to include',
            type: 'textarea',
            rows: 3,
            placeholder: 'Hypothesis,Why now,Guardrails,Success metric'
        },
        {
            key: 'includeReflection',
            label: 'Add reflection prompts',
            type: 'checkbox'
        },
        {
            key: 'customHighlights',
            label: 'Custom highlights',
            type: 'textarea',
            rows: 3,
            placeholder: 'Wins to celebrate'
        }
]
    },
    {
        id: 'extended-trigger-campaign-brief',
        category: 'trigger',
        name: 'Campaign narrative composer',
        description: 'Design a campaign story with audience emotions, key beats, and content sparks.',
        icon: 'megaphone',
        accent: '#facc15',
        tags: [
        'template',
        'marketing',
        'story',
        'trigger'
],
        mode: 'template',
        topic: 'the campaign',
        tones: [
        'vibrant',
        'clever',
        'grounded',
        'ambitious',
        'joyful'
],
        sections: [
        {
            title: 'Audience heartbeat',
            theme: 'audience',
            prompts: [
        'Describe how audience shows up for the campaign today.',
        'List the voices who can elevate audience right now.',
        'Capture one bold experiment connected to audience.',
        'Note signals that confirm audience is thriving.',
        'Document risks that could erode audience if ignored.',
        'Imagine how audience feels when everything clicks.',
        'Outline partnerships that reinforce audience.',
        'Surface questions still open about audience.',
        'Highlight a customer story that embodies audience.',
        'Define a tiny action that nourishes audience today.',
        'Express gratitude related to audience moments.',
        'Sketch the momentum curve of audience across the week.'
],
            ideas: [
        'We could celebrate audience by amplifying arc.',
        'Invite channel to co-create audience signals.',
        'Prototype a habit that keeps audience visible.',
        'Audit the workflows touching audience moments.',
        'Pair up with channel to unstick audience blockers.',
        'Share a win around audience with the wider team.',
        'Capture metrics that relate to audience in the dashboard.',
        'Host a five-minute retro on audience mid-week.',
        'Create an inspirational mood board for audience.',
        'Curate a playlist that mirrors the energy of audience.',
        'Draft a short story describing audience success.',
        'Identify one constraint to relax around audience.'
],
            checkpoints: [
        'Confidence in audience today',
        'Support requested for audience',
        'Signals to monitor for audience',
        'Decision pending around audience',
        'Celebration planned for audience',
        'Learning captured about audience',
        'Risk mitigation for audience',
        'Data sources verifying audience',
        'Stakeholders cheering audience',
        'Timeline adjustments affecting audience',
        'Resources to unlock audience',
        'Experiments for audience next'
]
        },
        {
            title: 'Message pillars',
            theme: 'message',
            prompts: [
        'Describe how message shows up for the campaign today.',
        'List the voices who can elevate message right now.',
        'Capture one bold experiment connected to message.',
        'Note signals that confirm message is thriving.',
        'Document risks that could erode message if ignored.',
        'Imagine how message feels when everything clicks.',
        'Outline partnerships that reinforce message.',
        'Surface questions still open about message.',
        'Highlight a customer story that embodies message.',
        'Define a tiny action that nourishes message today.',
        'Express gratitude related to message moments.',
        'Sketch the momentum curve of message across the week.'
],
            ideas: [
        'We could celebrate message by amplifying channel.',
        'Invite creative to co-create message signals.',
        'Prototype a habit that keeps message visible.',
        'Audit the workflows touching message moments.',
        'Pair up with creative to unstick message blockers.',
        'Share a win around message with the wider team.',
        'Capture metrics that relate to message in the dashboard.',
        'Host a five-minute retro on message mid-week.',
        'Create an inspirational mood board for message.',
        'Curate a playlist that mirrors the energy of message.',
        'Draft a short story describing message success.',
        'Identify one constraint to relax around message.'
],
            checkpoints: [
        'Confidence in message today',
        'Support requested for message',
        'Signals to monitor for message',
        'Decision pending around message',
        'Celebration planned for message',
        'Learning captured about message',
        'Risk mitigation for message',
        'Data sources verifying message',
        'Stakeholders cheering message',
        'Timeline adjustments affecting message',
        'Resources to unlock message',
        'Experiments for message next'
]
        },
        {
            title: 'Story arc',
            theme: 'arc',
            prompts: [
        'Describe how arc shows up for the campaign today.',
        'List the voices who can elevate arc right now.',
        'Capture one bold experiment connected to arc.',
        'Note signals that confirm arc is thriving.',
        'Document risks that could erode arc if ignored.',
        'Imagine how arc feels when everything clicks.',
        'Outline partnerships that reinforce arc.',
        'Surface questions still open about arc.',
        'Highlight a customer story that embodies arc.',
        'Define a tiny action that nourishes arc today.',
        'Express gratitude related to arc moments.',
        'Sketch the momentum curve of arc across the week.'
],
            ideas: [
        'We could celebrate arc by amplifying creative.',
        'Invite proof to co-create arc signals.',
        'Prototype a habit that keeps arc visible.',
        'Audit the workflows touching arc moments.',
        'Pair up with proof to unstick arc blockers.',
        'Share a win around arc with the wider team.',
        'Capture metrics that relate to arc in the dashboard.',
        'Host a five-minute retro on arc mid-week.',
        'Create an inspirational mood board for arc.',
        'Curate a playlist that mirrors the energy of arc.',
        'Draft a short story describing arc success.',
        'Identify one constraint to relax around arc.'
],
            checkpoints: [
        'Confidence in arc today',
        'Support requested for arc',
        'Signals to monitor for arc',
        'Decision pending around arc',
        'Celebration planned for arc',
        'Learning captured about arc',
        'Risk mitigation for arc',
        'Data sources verifying arc',
        'Stakeholders cheering arc',
        'Timeline adjustments affecting arc',
        'Resources to unlock arc',
        'Experiments for arc next'
]
        },
        {
            title: 'Channel choreography',
            theme: 'channel',
            prompts: [
        'Describe how channel shows up for the campaign today.',
        'List the voices who can elevate channel right now.',
        'Capture one bold experiment connected to channel.',
        'Note signals that confirm channel is thriving.',
        'Document risks that could erode channel if ignored.',
        'Imagine how channel feels when everything clicks.',
        'Outline partnerships that reinforce channel.',
        'Surface questions still open about channel.',
        'Highlight a customer story that embodies channel.',
        'Define a tiny action that nourishes channel today.',
        'Express gratitude related to channel moments.',
        'Sketch the momentum curve of channel across the week.'
],
            ideas: [
        'We could celebrate channel by amplifying proof.',
        'Invite countdown to co-create channel signals.',
        'Prototype a habit that keeps channel visible.',
        'Audit the workflows touching channel moments.',
        'Pair up with countdown to unstick channel blockers.',
        'Share a win around channel with the wider team.',
        'Capture metrics that relate to channel in the dashboard.',
        'Host a five-minute retro on channel mid-week.',
        'Create an inspirational mood board for channel.',
        'Curate a playlist that mirrors the energy of channel.',
        'Draft a short story describing channel success.',
        'Identify one constraint to relax around channel.'
],
            checkpoints: [
        'Confidence in channel today',
        'Support requested for channel',
        'Signals to monitor for channel',
        'Decision pending around channel',
        'Celebration planned for channel',
        'Learning captured about channel',
        'Risk mitigation for channel',
        'Data sources verifying channel',
        'Stakeholders cheering channel',
        'Timeline adjustments affecting channel',
        'Resources to unlock channel',
        'Experiments for channel next'
]
        },
        {
            title: 'Creative sparks',
            theme: 'creative',
            prompts: [
        'Describe how creative shows up for the campaign today.',
        'List the voices who can elevate creative right now.',
        'Capture one bold experiment connected to creative.',
        'Note signals that confirm creative is thriving.',
        'Document risks that could erode creative if ignored.',
        'Imagine how creative feels when everything clicks.',
        'Outline partnerships that reinforce creative.',
        'Surface questions still open about creative.',
        'Highlight a customer story that embodies creative.',
        'Define a tiny action that nourishes creative today.',
        'Express gratitude related to creative moments.',
        'Sketch the momentum curve of creative across the week.'
],
            ideas: [
        'We could celebrate creative by amplifying countdown.',
        'Invite celebration to co-create creative signals.',
        'Prototype a habit that keeps creative visible.',
        'Audit the workflows touching creative moments.',
        'Pair up with celebration to unstick creative blockers.',
        'Share a win around creative with the wider team.',
        'Capture metrics that relate to creative in the dashboard.',
        'Host a five-minute retro on creative mid-week.',
        'Create an inspirational mood board for creative.',
        'Curate a playlist that mirrors the energy of creative.',
        'Draft a short story describing creative success.',
        'Identify one constraint to relax around creative.'
],
            checkpoints: [
        'Confidence in creative today',
        'Support requested for creative',
        'Signals to monitor for creative',
        'Decision pending around creative',
        'Celebration planned for creative',
        'Learning captured about creative',
        'Risk mitigation for creative',
        'Data sources verifying creative',
        'Stakeholders cheering creative',
        'Timeline adjustments affecting creative',
        'Resources to unlock creative',
        'Experiments for creative next'
]
        },
        {
            title: 'Proof points',
            theme: 'proof',
            prompts: [
        'Describe how proof shows up for the campaign today.',
        'List the voices who can elevate proof right now.',
        'Capture one bold experiment connected to proof.',
        'Note signals that confirm proof is thriving.',
        'Document risks that could erode proof if ignored.',
        'Imagine how proof feels when everything clicks.',
        'Outline partnerships that reinforce proof.',
        'Surface questions still open about proof.',
        'Highlight a customer story that embodies proof.',
        'Define a tiny action that nourishes proof today.',
        'Express gratitude related to proof moments.',
        'Sketch the momentum curve of proof across the week.'
],
            ideas: [
        'We could celebrate proof by amplifying celebration.',
        'Invite audience to co-create proof signals.',
        'Prototype a habit that keeps proof visible.',
        'Audit the workflows touching proof moments.',
        'Pair up with audience to unstick proof blockers.',
        'Share a win around proof with the wider team.',
        'Capture metrics that relate to proof in the dashboard.',
        'Host a five-minute retro on proof mid-week.',
        'Create an inspirational mood board for proof.',
        'Curate a playlist that mirrors the energy of proof.',
        'Draft a short story describing proof success.',
        'Identify one constraint to relax around proof.'
],
            checkpoints: [
        'Confidence in proof today',
        'Support requested for proof',
        'Signals to monitor for proof',
        'Decision pending around proof',
        'Celebration planned for proof',
        'Learning captured about proof',
        'Risk mitigation for proof',
        'Data sources verifying proof',
        'Stakeholders cheering proof',
        'Timeline adjustments affecting proof',
        'Resources to unlock proof',
        'Experiments for proof next'
]
        },
        {
            title: 'Launch countdown',
            theme: 'countdown',
            prompts: [
        'Describe how countdown shows up for the campaign today.',
        'List the voices who can elevate countdown right now.',
        'Capture one bold experiment connected to countdown.',
        'Note signals that confirm countdown is thriving.',
        'Document risks that could erode countdown if ignored.',
        'Imagine how countdown feels when everything clicks.',
        'Outline partnerships that reinforce countdown.',
        'Surface questions still open about countdown.',
        'Highlight a customer story that embodies countdown.',
        'Define a tiny action that nourishes countdown today.',
        'Express gratitude related to countdown moments.',
        'Sketch the momentum curve of countdown across the week.'
],
            ideas: [
        'We could celebrate countdown by amplifying audience.',
        'Invite message to co-create countdown signals.',
        'Prototype a habit that keeps countdown visible.',
        'Audit the workflows touching countdown moments.',
        'Pair up with message to unstick countdown blockers.',
        'Share a win around countdown with the wider team.',
        'Capture metrics that relate to countdown in the dashboard.',
        'Host a five-minute retro on countdown mid-week.',
        'Create an inspirational mood board for countdown.',
        'Curate a playlist that mirrors the energy of countdown.',
        'Draft a short story describing countdown success.',
        'Identify one constraint to relax around countdown.'
],
            checkpoints: [
        'Confidence in countdown today',
        'Support requested for countdown',
        'Signals to monitor for countdown',
        'Decision pending around countdown',
        'Celebration planned for countdown',
        'Learning captured about countdown',
        'Risk mitigation for countdown',
        'Data sources verifying countdown',
        'Stakeholders cheering countdown',
        'Timeline adjustments affecting countdown',
        'Resources to unlock countdown',
        'Experiments for countdown next'
]
        },
        {
            title: 'Celebration moments',
            theme: 'celebration',
            prompts: [
        'Describe how celebration shows up for the campaign today.',
        'List the voices who can elevate celebration right now.',
        'Capture one bold experiment connected to celebration.',
        'Note signals that confirm celebration is thriving.',
        'Document risks that could erode celebration if ignored.',
        'Imagine how celebration feels when everything clicks.',
        'Outline partnerships that reinforce celebration.',
        'Surface questions still open about celebration.',
        'Highlight a customer story that embodies celebration.',
        'Define a tiny action that nourishes celebration today.',
        'Express gratitude related to celebration moments.',
        'Sketch the momentum curve of celebration across the week.'
],
            ideas: [
        'We could celebrate celebration by amplifying message.',
        'Invite arc to co-create celebration signals.',
        'Prototype a habit that keeps celebration visible.',
        'Audit the workflows touching celebration moments.',
        'Pair up with arc to unstick celebration blockers.',
        'Share a win around celebration with the wider team.',
        'Capture metrics that relate to celebration in the dashboard.',
        'Host a five-minute retro on celebration mid-week.',
        'Create an inspirational mood board for celebration.',
        'Curate a playlist that mirrors the energy of celebration.',
        'Draft a short story describing celebration success.',
        'Identify one constraint to relax around celebration.'
],
            checkpoints: [
        'Confidence in celebration today',
        'Support requested for celebration',
        'Signals to monitor for celebration',
        'Decision pending around celebration',
        'Celebration planned for celebration',
        'Learning captured about celebration',
        'Risk mitigation for celebration',
        'Data sources verifying celebration',
        'Stakeholders cheering celebration',
        'Timeline adjustments affecting celebration',
        'Resources to unlock celebration',
        'Experiments for celebration next'
]
        }
],
        affirmations: [
        'We protect momentum even when things wobble.',
        'Curiosity fuels every iteration we attempt.',
        'We celebrate micro-wins loudly and often.',
        'Humans first, then process, then tooling.',
        'We learn faster together than alone.',
        'Every obstacle carries a hidden insight.',
        'Joy and rigor can absolutely coexist.',
        'We narrate progress so others feel invited.',
        'Pauses are an intentional productivity move.',
        'We choose clarity over speed when needed.',
        'Listening deeply is our superpower.',
        'We prioritise kindness without losing edge.',
        'Celebration is a strategy, not an afterthought.',
        'Asking better questions unlocks better answers.',
        'We leave room for surprise and delight.',
        'Tiny experiments accumulate into bold impact.',
        'Documenting context keeps the future grateful.',
        'We signal progress with warmth and precision.',
        'Reflection is the bridge between today and tomorrow.',
        'We craft experiences that feel like a conversation.',
        'We choose audience storyline',
        'We choose audience highlight',
        'We choose audience question',
        'We choose audience invitation',
        'We choose audience experiment',
        'We choose message storyline',
        'We choose message highlight',
        'We choose message question',
        'We choose message invitation',
        'We choose message experiment',
        'We choose arc storyline',
        'We choose arc highlight',
        'We choose arc question',
        'We choose arc invitation',
        'We choose arc experiment',
        'We choose channel storyline',
        'We choose channel highlight',
        'We choose channel question',
        'We choose channel invitation',
        'We choose channel experiment',
        'We choose creative storyline',
        'We choose creative highlight',
        'We choose creative question',
        'We choose creative invitation',
        'We choose creative experiment',
        'We choose proof storyline',
        'We choose proof highlight',
        'We choose proof question',
        'We choose proof invitation',
        'We choose proof experiment',
        'We choose countdown storyline',
        'We choose countdown highlight',
        'We choose countdown question',
        'We choose countdown invitation',
        'We choose countdown experiment',
        'We choose celebration storyline',
        'We choose celebration highlight',
        'We choose celebration question',
        'We choose celebration invitation',
        'We choose celebration experiment'
],
        defaultConfig: {
    title: 'Campaign narrative composer',
    tone: 'vibrant',
    sections: 'Audience heartbeat,Message pillars,Story arc,Channel choreography',
    includeReflection: true,
    customHighlights: ''
},
        form: [
        {
            key: 'title',
            label: 'Template title',
            type: 'text',
            placeholder: 'Campaign narrative composer'
        },
        {
            key: 'tone',
            label: 'Tone',
            type: 'select',
            options: [
        {
            value: 'vibrant',
            label: 'Vibrant'
        },
        {
            value: 'clever',
            label: 'Clever'
        },
        {
            value: 'grounded',
            label: 'Grounded'
        },
        {
            value: 'ambitious',
            label: 'Ambitious'
        },
        {
            value: 'joyful',
            label: 'Joyful'
        }
]
        },
        {
            key: 'sections',
            label: 'Sections to include',
            type: 'textarea',
            rows: 3,
            placeholder: 'Audience heartbeat,Message pillars,Story arc,Channel choreography'
        },
        {
            key: 'includeReflection',
            label: 'Add reflection prompts',
            type: 'checkbox'
        },
        {
            key: 'customHighlights',
            label: 'Custom highlights',
            type: 'textarea',
            rows: 3,
            placeholder: 'Wins to celebrate'
        }
]
    },
    {
        id: 'extended-trigger-meeting-playbook',
        category: 'trigger',
        name: 'Meeting playbook generator',
        description: 'Compose a meeting playbook covering goals, rituals, and follow-up pulses.',
        icon: 'users',
        accent: '#c084fc',
        tags: [
        'template',
        'facilitation',
        'ritual',
        'trigger'
],
        mode: 'template',
        topic: 'the meeting',
        tones: [
        'intentional',
        'fast',
        'welcoming',
        'analytical',
        'playful'
],
        sections: [
        {
            title: 'Purpose',
            theme: 'purpose',
            prompts: [
        'Describe how purpose shows up for the meeting today.',
        'List the voices who can elevate purpose right now.',
        'Capture one bold experiment connected to purpose.',
        'Note signals that confirm purpose is thriving.',
        'Document risks that could erode purpose if ignored.',
        'Imagine how purpose feels when everything clicks.',
        'Outline partnerships that reinforce purpose.',
        'Surface questions still open about purpose.',
        'Highlight a customer story that embodies purpose.',
        'Define a tiny action that nourishes purpose today.',
        'Express gratitude related to purpose moments.',
        'Sketch the momentum curve of purpose across the week.'
],
            ideas: [
        'We could celebrate purpose by amplifying agenda.',
        'Invite decision to co-create purpose signals.',
        'Prototype a habit that keeps purpose visible.',
        'Audit the workflows touching purpose moments.',
        'Pair up with decision to unstick purpose blockers.',
        'Share a win around purpose with the wider team.',
        'Capture metrics that relate to purpose in the dashboard.',
        'Host a five-minute retro on purpose mid-week.',
        'Create an inspirational mood board for purpose.',
        'Curate a playlist that mirrors the energy of purpose.',
        'Draft a short story describing purpose success.',
        'Identify one constraint to relax around purpose.'
],
            checkpoints: [
        'Confidence in purpose today',
        'Support requested for purpose',
        'Signals to monitor for purpose',
        'Decision pending around purpose',
        'Celebration planned for purpose',
        'Learning captured about purpose',
        'Risk mitigation for purpose',
        'Data sources verifying purpose',
        'Stakeholders cheering purpose',
        'Timeline adjustments affecting purpose',
        'Resources to unlock purpose',
        'Experiments for purpose next'
]
        },
        {
            title: 'Participants',
            theme: 'people',
            prompts: [
        'Describe how people shows up for the meeting today.',
        'List the voices who can elevate people right now.',
        'Capture one bold experiment connected to people.',
        'Note signals that confirm people is thriving.',
        'Document risks that could erode people if ignored.',
        'Imagine how people feels when everything clicks.',
        'Outline partnerships that reinforce people.',
        'Surface questions still open about people.',
        'Highlight a customer story that embodies people.',
        'Define a tiny action that nourishes people today.',
        'Express gratitude related to people moments.',
        'Sketch the momentum curve of people across the week.'
],
            ideas: [
        'We could celebrate people by amplifying decision.',
        'Invite inclusion to co-create people signals.',
        'Prototype a habit that keeps people visible.',
        'Audit the workflows touching people moments.',
        'Pair up with inclusion to unstick people blockers.',
        'Share a win around people with the wider team.',
        'Capture metrics that relate to people in the dashboard.',
        'Host a five-minute retro on people mid-week.',
        'Create an inspirational mood board for people.',
        'Curate a playlist that mirrors the energy of people.',
        'Draft a short story describing people success.',
        'Identify one constraint to relax around people.'
],
            checkpoints: [
        'Confidence in people today',
        'Support requested for people',
        'Signals to monitor for people',
        'Decision pending around people',
        'Celebration planned for people',
        'Learning captured about people',
        'Risk mitigation for people',
        'Data sources verifying people',
        'Stakeholders cheering people',
        'Timeline adjustments affecting people',
        'Resources to unlock people',
        'Experiments for people next'
]
        },
        {
            title: 'Agenda flow',
            theme: 'agenda',
            prompts: [
        'Describe how agenda shows up for the meeting today.',
        'List the voices who can elevate agenda right now.',
        'Capture one bold experiment connected to agenda.',
        'Note signals that confirm agenda is thriving.',
        'Document risks that could erode agenda if ignored.',
        'Imagine how agenda feels when everything clicks.',
        'Outline partnerships that reinforce agenda.',
        'Surface questions still open about agenda.',
        'Highlight a customer story that embodies agenda.',
        'Define a tiny action that nourishes agenda today.',
        'Express gratitude related to agenda moments.',
        'Sketch the momentum curve of agenda across the week.'
],
            ideas: [
        'We could celebrate agenda by amplifying inclusion.',
        'Invite time to co-create agenda signals.',
        'Prototype a habit that keeps agenda visible.',
        'Audit the workflows touching agenda moments.',
        'Pair up with time to unstick agenda blockers.',
        'Share a win around agenda with the wider team.',
        'Capture metrics that relate to agenda in the dashboard.',
        'Host a five-minute retro on agenda mid-week.',
        'Create an inspirational mood board for agenda.',
        'Curate a playlist that mirrors the energy of agenda.',
        'Draft a short story describing agenda success.',
        'Identify one constraint to relax around agenda.'
],
            checkpoints: [
        'Confidence in agenda today',
        'Support requested for agenda',
        'Signals to monitor for agenda',
        'Decision pending around agenda',
        'Celebration planned for agenda',
        'Learning captured about agenda',
        'Risk mitigation for agenda',
        'Data sources verifying agenda',
        'Stakeholders cheering agenda',
        'Timeline adjustments affecting agenda',
        'Resources to unlock agenda',
        'Experiments for agenda next'
]
        },
        {
            title: 'Decision moments',
            theme: 'decision',
            prompts: [
        'Describe how decision shows up for the meeting today.',
        'List the voices who can elevate decision right now.',
        'Capture one bold experiment connected to decision.',
        'Note signals that confirm decision is thriving.',
        'Document risks that could erode decision if ignored.',
        'Imagine how decision feels when everything clicks.',
        'Outline partnerships that reinforce decision.',
        'Surface questions still open about decision.',
        'Highlight a customer story that embodies decision.',
        'Define a tiny action that nourishes decision today.',
        'Express gratitude related to decision moments.',
        'Sketch the momentum curve of decision across the week.'
],
            ideas: [
        'We could celebrate decision by amplifying time.',
        'Invite follow-up to co-create decision signals.',
        'Prototype a habit that keeps decision visible.',
        'Audit the workflows touching decision moments.',
        'Pair up with follow-up to unstick decision blockers.',
        'Share a win around decision with the wider team.',
        'Capture metrics that relate to decision in the dashboard.',
        'Host a five-minute retro on decision mid-week.',
        'Create an inspirational mood board for decision.',
        'Curate a playlist that mirrors the energy of decision.',
        'Draft a short story describing decision success.',
        'Identify one constraint to relax around decision.'
],
            checkpoints: [
        'Confidence in decision today',
        'Support requested for decision',
        'Signals to monitor for decision',
        'Decision pending around decision',
        'Celebration planned for decision',
        'Learning captured about decision',
        'Risk mitigation for decision',
        'Data sources verifying decision',
        'Stakeholders cheering decision',
        'Timeline adjustments affecting decision',
        'Resources to unlock decision',
        'Experiments for decision next'
]
        },
        {
            title: 'Inclusion moves',
            theme: 'inclusion',
            prompts: [
        'Describe how inclusion shows up for the meeting today.',
        'List the voices who can elevate inclusion right now.',
        'Capture one bold experiment connected to inclusion.',
        'Note signals that confirm inclusion is thriving.',
        'Document risks that could erode inclusion if ignored.',
        'Imagine how inclusion feels when everything clicks.',
        'Outline partnerships that reinforce inclusion.',
        'Surface questions still open about inclusion.',
        'Highlight a customer story that embodies inclusion.',
        'Define a tiny action that nourishes inclusion today.',
        'Express gratitude related to inclusion moments.',
        'Sketch the momentum curve of inclusion across the week.'
],
            ideas: [
        'We could celebrate inclusion by amplifying follow-up.',
        'Invite feedback to co-create inclusion signals.',
        'Prototype a habit that keeps inclusion visible.',
        'Audit the workflows touching inclusion moments.',
        'Pair up with feedback to unstick inclusion blockers.',
        'Share a win around inclusion with the wider team.',
        'Capture metrics that relate to inclusion in the dashboard.',
        'Host a five-minute retro on inclusion mid-week.',
        'Create an inspirational mood board for inclusion.',
        'Curate a playlist that mirrors the energy of inclusion.',
        'Draft a short story describing inclusion success.',
        'Identify one constraint to relax around inclusion.'
],
            checkpoints: [
        'Confidence in inclusion today',
        'Support requested for inclusion',
        'Signals to monitor for inclusion',
        'Decision pending around inclusion',
        'Celebration planned for inclusion',
        'Learning captured about inclusion',
        'Risk mitigation for inclusion',
        'Data sources verifying inclusion',
        'Stakeholders cheering inclusion',
        'Timeline adjustments affecting inclusion',
        'Resources to unlock inclusion',
        'Experiments for inclusion next'
]
        },
        {
            title: 'Timeboxing',
            theme: 'time',
            prompts: [
        'Describe how time shows up for the meeting today.',
        'List the voices who can elevate time right now.',
        'Capture one bold experiment connected to time.',
        'Note signals that confirm time is thriving.',
        'Document risks that could erode time if ignored.',
        'Imagine how time feels when everything clicks.',
        'Outline partnerships that reinforce time.',
        'Surface questions still open about time.',
        'Highlight a customer story that embodies time.',
        'Define a tiny action that nourishes time today.',
        'Express gratitude related to time moments.',
        'Sketch the momentum curve of time across the week.'
],
            ideas: [
        'We could celebrate time by amplifying feedback.',
        'Invite purpose to co-create time signals.',
        'Prototype a habit that keeps time visible.',
        'Audit the workflows touching time moments.',
        'Pair up with purpose to unstick time blockers.',
        'Share a win around time with the wider team.',
        'Capture metrics that relate to time in the dashboard.',
        'Host a five-minute retro on time mid-week.',
        'Create an inspirational mood board for time.',
        'Curate a playlist that mirrors the energy of time.',
        'Draft a short story describing time success.',
        'Identify one constraint to relax around time.'
],
            checkpoints: [
        'Confidence in time today',
        'Support requested for time',
        'Signals to monitor for time',
        'Decision pending around time',
        'Celebration planned for time',
        'Learning captured about time',
        'Risk mitigation for time',
        'Data sources verifying time',
        'Stakeholders cheering time',
        'Timeline adjustments affecting time',
        'Resources to unlock time',
        'Experiments for time next'
]
        },
        {
            title: 'Follow-ups',
            theme: 'follow-up',
            prompts: [
        'Describe how follow-up shows up for the meeting today.',
        'List the voices who can elevate follow-up right now.',
        'Capture one bold experiment connected to follow-up.',
        'Note signals that confirm follow-up is thriving.',
        'Document risks that could erode follow-up if ignored.',
        'Imagine how follow-up feels when everything clicks.',
        'Outline partnerships that reinforce follow-up.',
        'Surface questions still open about follow-up.',
        'Highlight a customer story that embodies follow-up.',
        'Define a tiny action that nourishes follow-up today.',
        'Express gratitude related to follow-up moments.',
        'Sketch the momentum curve of follow-up across the week.'
],
            ideas: [
        'We could celebrate follow-up by amplifying purpose.',
        'Invite people to co-create follow-up signals.',
        'Prototype a habit that keeps follow-up visible.',
        'Audit the workflows touching follow-up moments.',
        'Pair up with people to unstick follow-up blockers.',
        'Share a win around follow-up with the wider team.',
        'Capture metrics that relate to follow-up in the dashboard.',
        'Host a five-minute retro on follow-up mid-week.',
        'Create an inspirational mood board for follow-up.',
        'Curate a playlist that mirrors the energy of follow-up.',
        'Draft a short story describing follow-up success.',
        'Identify one constraint to relax around follow-up.'
],
            checkpoints: [
        'Confidence in follow-up today',
        'Support requested for follow-up',
        'Signals to monitor for follow-up',
        'Decision pending around follow-up',
        'Celebration planned for follow-up',
        'Learning captured about follow-up',
        'Risk mitigation for follow-up',
        'Data sources verifying follow-up',
        'Stakeholders cheering follow-up',
        'Timeline adjustments affecting follow-up',
        'Resources to unlock follow-up',
        'Experiments for follow-up next'
]
        },
        {
            title: 'Feedback loop',
            theme: 'feedback',
            prompts: [
        'Describe how feedback shows up for the meeting today.',
        'List the voices who can elevate feedback right now.',
        'Capture one bold experiment connected to feedback.',
        'Note signals that confirm feedback is thriving.',
        'Document risks that could erode feedback if ignored.',
        'Imagine how feedback feels when everything clicks.',
        'Outline partnerships that reinforce feedback.',
        'Surface questions still open about feedback.',
        'Highlight a customer story that embodies feedback.',
        'Define a tiny action that nourishes feedback today.',
        'Express gratitude related to feedback moments.',
        'Sketch the momentum curve of feedback across the week.'
],
            ideas: [
        'We could celebrate feedback by amplifying people.',
        'Invite agenda to co-create feedback signals.',
        'Prototype a habit that keeps feedback visible.',
        'Audit the workflows touching feedback moments.',
        'Pair up with agenda to unstick feedback blockers.',
        'Share a win around feedback with the wider team.',
        'Capture metrics that relate to feedback in the dashboard.',
        'Host a five-minute retro on feedback mid-week.',
        'Create an inspirational mood board for feedback.',
        'Curate a playlist that mirrors the energy of feedback.',
        'Draft a short story describing feedback success.',
        'Identify one constraint to relax around feedback.'
],
            checkpoints: [
        'Confidence in feedback today',
        'Support requested for feedback',
        'Signals to monitor for feedback',
        'Decision pending around feedback',
        'Celebration planned for feedback',
        'Learning captured about feedback',
        'Risk mitigation for feedback',
        'Data sources verifying feedback',
        'Stakeholders cheering feedback',
        'Timeline adjustments affecting feedback',
        'Resources to unlock feedback',
        'Experiments for feedback next'
]
        }
],
        affirmations: [
        'We protect momentum even when things wobble.',
        'Curiosity fuels every iteration we attempt.',
        'We celebrate micro-wins loudly and often.',
        'Humans first, then process, then tooling.',
        'We learn faster together than alone.',
        'Every obstacle carries a hidden insight.',
        'Joy and rigor can absolutely coexist.',
        'We narrate progress so others feel invited.',
        'Pauses are an intentional productivity move.',
        'We choose clarity over speed when needed.',
        'Listening deeply is our superpower.',
        'We prioritise kindness without losing edge.',
        'Celebration is a strategy, not an afterthought.',
        'Asking better questions unlocks better answers.',
        'We leave room for surprise and delight.',
        'Tiny experiments accumulate into bold impact.',
        'Documenting context keeps the future grateful.',
        'We signal progress with warmth and precision.',
        'Reflection is the bridge between today and tomorrow.',
        'We craft experiences that feel like a conversation.',
        'We choose purpose storyline',
        'We choose purpose highlight',
        'We choose purpose question',
        'We choose purpose invitation',
        'We choose purpose experiment',
        'We choose people storyline',
        'We choose people highlight',
        'We choose people question',
        'We choose people invitation',
        'We choose people experiment',
        'We choose agenda storyline',
        'We choose agenda highlight',
        'We choose agenda question',
        'We choose agenda invitation',
        'We choose agenda experiment',
        'We choose decision storyline',
        'We choose decision highlight',
        'We choose decision question',
        'We choose decision invitation',
        'We choose decision experiment',
        'We choose inclusion storyline',
        'We choose inclusion highlight',
        'We choose inclusion question',
        'We choose inclusion invitation',
        'We choose inclusion experiment',
        'We choose time storyline',
        'We choose time highlight',
        'We choose time question',
        'We choose time invitation',
        'We choose time experiment',
        'We choose follow-up storyline',
        'We choose follow-up highlight',
        'We choose follow-up question',
        'We choose follow-up invitation',
        'We choose follow-up experiment',
        'We choose feedback storyline',
        'We choose feedback highlight',
        'We choose feedback question',
        'We choose feedback invitation',
        'We choose feedback experiment'
],
        defaultConfig: {
    title: 'Meeting playbook generator',
    tone: 'intentional',
    sections: 'Purpose,Participants,Agenda flow,Decision moments',
    includeReflection: true,
    customHighlights: ''
},
        form: [
        {
            key: 'title',
            label: 'Template title',
            type: 'text',
            placeholder: 'Meeting playbook generator'
        },
        {
            key: 'tone',
            label: 'Tone',
            type: 'select',
            options: [
        {
            value: 'intentional',
            label: 'Intentional'
        },
        {
            value: 'fast',
            label: 'Fast'
        },
        {
            value: 'welcoming',
            label: 'Welcoming'
        },
        {
            value: 'analytical',
            label: 'Analytical'
        },
        {
            value: 'playful',
            label: 'Playful'
        }
]
        },
        {
            key: 'sections',
            label: 'Sections to include',
            type: 'textarea',
            rows: 3,
            placeholder: 'Purpose,Participants,Agenda flow,Decision moments'
        },
        {
            key: 'includeReflection',
            label: 'Add reflection prompts',
            type: 'checkbox'
        },
        {
            key: 'customHighlights',
            label: 'Custom highlights',
            type: 'textarea',
            rows: 3,
            placeholder: 'Wins to celebrate'
        }
]
    },
    {
        id: 'extended-action-preamble',
        category: 'action',
        name: 'Preamble composer',
        description: 'Prepend a contextual preamble with intent, audience, and tone cues.',
        icon: 'corner-left-up',
        accent: '#38bdf8',
        tags: [
        'action',
        'text',
        'context'
],
        mode: 'transform',
        operation: 'prepend',
        motifs: [
        'intent',
        'audience',
        'tone',
        'moment',
        'promise'
],
        patterns: [
        'Context headline that references {motif}.',
        'Elaborate on context with a vivid detail about {motif}.',
        'Describe the tension surrounding context and {motif}.',
        'Outline a support move linked to context and {motif}.',
        'Suggest a celebratory note for context celebrating {motif}.',
        'Document a follow-up action for context anchored in {motif}.',
        'Who cares headline that references {motif}.',
        'Elaborate on who cares with a vivid detail about {motif}.',
        'Describe the tension surrounding who cares and {motif}.',
        'Outline a support move linked to who cares and {motif}.',
        'Suggest a celebratory note for who cares celebrating {motif}.',
        'Document a follow-up action for who cares anchored in {motif}.',
        'Desired response headline that references {motif}.',
        'Elaborate on desired response with a vivid detail about {motif}.',
        'Describe the tension surrounding desired response and {motif}.',
        'Outline a support move linked to desired response and {motif}.',
        'Suggest a celebratory note for desired response celebrating {motif}.',
        'Document a follow-up action for desired response anchored in {motif}.',
        'Voice guidance headline that references {motif}.',
        'Elaborate on voice guidance with a vivid detail about {motif}.',
        'Describe the tension surrounding voice guidance and {motif}.',
        'Outline a support move linked to voice guidance and {motif}.',
        'Suggest a celebratory note for voice guidance celebrating {motif}.',
        'Document a follow-up action for voice guidance anchored in {motif}.',
        'Story seed headline that references {motif}.',
        'Elaborate on story seed with a vivid detail about {motif}.',
        'Describe the tension surrounding story seed and {motif}.',
        'Outline a support move linked to story seed and {motif}.',
        'Suggest a celebratory note for story seed celebrating {motif}.',
        'Document a follow-up action for story seed anchored in {motif}.',
        'Checklist headline that references {motif}.',
        'Elaborate on checklist with a vivid detail about {motif}.',
        'Describe the tension surrounding checklist and {motif}.',
        'Outline a support move linked to checklist and {motif}.',
        'Suggest a celebratory note for checklist celebrating {motif}.',
        'Document a follow-up action for checklist anchored in {motif}.'
],
        hints: [
        'Channel a warm voice to express the intention.',
        'When feeling warm, keep the pacing generous.',
        'Warm energy pairs well with contrasting punctuation.',
        'Invite a warm ally to review the result.',
        'Channel a direct voice to express the intention.',
        'When feeling direct, keep the pacing generous.',
        'Direct energy pairs well with contrasting punctuation.',
        'Invite a direct ally to review the result.',
        'Channel a playful voice to express the intention.',
        'When feeling playful, keep the pacing generous.',
        'Playful energy pairs well with contrasting punctuation.',
        'Invite a playful ally to review the result.',
        'Channel a authoritative voice to express the intention.',
        'When feeling authoritative, keep the pacing generous.',
        'Authoritative energy pairs well with contrasting punctuation.',
        'Invite a authoritative ally to review the result.',
        'Channel a friendly voice to express the intention.',
        'When feeling friendly, keep the pacing generous.',
        'Friendly energy pairs well with contrasting punctuation.',
        'Invite a friendly ally to review the result.'
],
        defaultConfig: {
    intensity: 'warm',
    motif: 'intent',
    divider: '---',
    maxItems: 6,
    appendNotes: true
},
        form: [
        {
            key: 'intensity',
            label: 'Tone intensity',
            type: 'select',
            options: [
        {
            value: 'warm',
            label: 'Warm'
        },
        {
            value: 'direct',
            label: 'Direct'
        },
        {
            value: 'playful',
            label: 'Playful'
        },
        {
            value: 'authoritative',
            label: 'Authoritative'
        },
        {
            value: 'friendly',
            label: 'Friendly'
        }
]
        },
        {
            key: 'motif',
            label: 'Motif',
            type: 'select',
            options: [
        {
            value: 'intent',
            label: 'Intent'
        },
        {
            value: 'audience',
            label: 'Audience'
        },
        {
            value: 'tone',
            label: 'Tone'
        },
        {
            value: 'moment',
            label: 'Moment'
        },
        {
            value: 'promise',
            label: 'Promise'
        }
]
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            min: 1,
            placeholder: '6'
        },
        {
            key: 'divider',
            label: 'Divider',
            type: 'text',
            placeholder: '---'
        },
        {
            key: 'appendNotes',
            label: 'Append creative notes',
            type: 'checkbox'
        }
]
    },
    {
        id: 'extended-action-closing',
        category: 'action',
        name: 'Closing cadence builder',
        description: 'Append a rich closing with gratitude, next steps, and reflection prompts.',
        icon: 'corner-right-down',
        accent: '#f472b6',
        tags: [
        'action',
        'text',
        'closing'
],
        mode: 'transform',
        operation: 'append',
        motifs: [
        'gratitude',
        'next step',
        'reflection',
        'encouragement',
        'invitation'
],
        patterns: [
        'Closing note headline that references {motif}.',
        'Elaborate on closing note with a vivid detail about {motif}.',
        'Describe the tension surrounding closing note and {motif}.',
        'Outline a support move linked to closing note and {motif}.',
        'Suggest a celebratory note for closing note celebrating {motif}.',
        'Document a follow-up action for closing note anchored in {motif}.',
        'Momentum spark headline that references {motif}.',
        'Elaborate on momentum spark with a vivid detail about {motif}.',
        'Describe the tension surrounding momentum spark and {motif}.',
        'Outline a support move linked to momentum spark and {motif}.',
        'Suggest a celebratory note for momentum spark celebrating {motif}.',
        'Document a follow-up action for momentum spark anchored in {motif}.',
        'Thank-you headline that references {motif}.',
        'Elaborate on thank-you with a vivid detail about {motif}.',
        'Describe the tension surrounding thank-you and {motif}.',
        'Outline a support move linked to thank-you and {motif}.',
        'Suggest a celebratory note for thank-you celebrating {motif}.',
        'Document a follow-up action for thank-you anchored in {motif}.',
        'Invitation headline that references {motif}.',
        'Elaborate on invitation with a vivid detail about {motif}.',
        'Describe the tension surrounding invitation and {motif}.',
        'Outline a support move linked to invitation and {motif}.',
        'Suggest a celebratory note for invitation celebrating {motif}.',
        'Document a follow-up action for invitation anchored in {motif}.',
        'Reflection headline that references {motif}.',
        'Elaborate on reflection with a vivid detail about {motif}.',
        'Describe the tension surrounding reflection and {motif}.',
        'Outline a support move linked to reflection and {motif}.',
        'Suggest a celebratory note for reflection celebrating {motif}.',
        'Document a follow-up action for reflection anchored in {motif}.',
        'Signal headline that references {motif}.',
        'Elaborate on signal with a vivid detail about {motif}.',
        'Describe the tension surrounding signal and {motif}.',
        'Outline a support move linked to signal and {motif}.',
        'Suggest a celebratory note for signal celebrating {motif}.',
        'Document a follow-up action for signal anchored in {motif}.'
],
        hints: [
        'Channel a grateful voice to express the intention.',
        'When feeling grateful, keep the pacing generous.',
        'Grateful energy pairs well with contrasting punctuation.',
        'Invite a grateful ally to review the result.',
        'Channel a optimistic voice to express the intention.',
        'When feeling optimistic, keep the pacing generous.',
        'Optimistic energy pairs well with contrasting punctuation.',
        'Invite a optimistic ally to review the result.',
        'Channel a calm voice to express the intention.',
        'When feeling calm, keep the pacing generous.',
        'Calm energy pairs well with contrasting punctuation.',
        'Invite a calm ally to review the result.',
        'Channel a celebratory voice to express the intention.',
        'When feeling celebratory, keep the pacing generous.',
        'Celebratory energy pairs well with contrasting punctuation.',
        'Invite a celebratory ally to review the result.',
        'Channel a supportive voice to express the intention.',
        'When feeling supportive, keep the pacing generous.',
        'Supportive energy pairs well with contrasting punctuation.',
        'Invite a supportive ally to review the result.'
],
        defaultConfig: {
    intensity: 'grateful',
    motif: 'gratitude',
    divider: '---',
    maxItems: 6,
    appendNotes: true
},
        form: [
        {
            key: 'intensity',
            label: 'Tone intensity',
            type: 'select',
            options: [
        {
            value: 'grateful',
            label: 'Grateful'
        },
        {
            value: 'optimistic',
            label: 'Optimistic'
        },
        {
            value: 'calm',
            label: 'Calm'
        },
        {
            value: 'celebratory',
            label: 'Celebratory'
        },
        {
            value: 'supportive',
            label: 'Supportive'
        }
]
        },
        {
            key: 'motif',
            label: 'Motif',
            type: 'select',
            options: [
        {
            value: 'gratitude',
            label: 'Gratitude'
        },
        {
            value: 'next-step',
            label: 'Next Step'
        },
        {
            value: 'reflection',
            label: 'Reflection'
        },
        {
            value: 'encouragement',
            label: 'Encouragement'
        },
        {
            value: 'invitation',
            label: 'Invitation'
        }
]
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            min: 1,
            placeholder: '6'
        },
        {
            key: 'divider',
            label: 'Divider',
            type: 'text',
            placeholder: '---'
        },
        {
            key: 'appendNotes',
            label: 'Append creative notes',
            type: 'checkbox'
        }
]
    },
    {
        id: 'extended-action-wrap-callout',
        category: 'action',
        name: 'Callout wrapper',
        description: 'Wrap the payload inside a stylised callout box with header and footer notes.',
        icon: 'square',
        accent: '#a855f7',
        tags: [
        'action',
        'format',
        'callout'
],
        mode: 'transform',
        operation: 'wrap',
        motifs: [
        'callout',
        'spotlight',
        'safety',
        'celebration',
        'reminder'
],
        patterns: [
        'Header headline that references {motif}.',
        'Elaborate on header with a vivid detail about {motif}.',
        'Describe the tension surrounding header and {motif}.',
        'Outline a support move linked to header and {motif}.',
        'Suggest a celebratory note for header celebrating {motif}.',
        'Document a follow-up action for header anchored in {motif}.',
        'Framing headline that references {motif}.',
        'Elaborate on framing with a vivid detail about {motif}.',
        'Describe the tension surrounding framing and {motif}.',
        'Outline a support move linked to framing and {motif}.',
        'Suggest a celebratory note for framing celebrating {motif}.',
        'Document a follow-up action for framing anchored in {motif}.',
        'Body headline that references {motif}.',
        'Elaborate on body with a vivid detail about {motif}.',
        'Describe the tension surrounding body and {motif}.',
        'Outline a support move linked to body and {motif}.',
        'Suggest a celebratory note for body celebrating {motif}.',
        'Document a follow-up action for body anchored in {motif}.',
        'Footer headline that references {motif}.',
        'Elaborate on footer with a vivid detail about {motif}.',
        'Describe the tension surrounding footer and {motif}.',
        'Outline a support move linked to footer and {motif}.',
        'Suggest a celebratory note for footer celebrating {motif}.',
        'Document a follow-up action for footer anchored in {motif}.',
        'Signature headline that references {motif}.',
        'Elaborate on signature with a vivid detail about {motif}.',
        'Describe the tension surrounding signature and {motif}.',
        'Outline a support move linked to signature and {motif}.',
        'Suggest a celebratory note for signature celebrating {motif}.',
        'Document a follow-up action for signature anchored in {motif}.',
        'Reminder headline that references {motif}.',
        'Elaborate on reminder with a vivid detail about {motif}.',
        'Describe the tension surrounding reminder and {motif}.',
        'Outline a support move linked to reminder and {motif}.',
        'Suggest a celebratory note for reminder celebrating {motif}.',
        'Document a follow-up action for reminder anchored in {motif}.'
],
        hints: [
        'Channel a informative voice to express the intention.',
        'When feeling informative, keep the pacing generous.',
        'Informative energy pairs well with contrasting punctuation.',
        'Invite a informative ally to review the result.',
        'Channel a urgent voice to express the intention.',
        'When feeling urgent, keep the pacing generous.',
        'Urgent energy pairs well with contrasting punctuation.',
        'Invite a urgent ally to review the result.',
        'Channel a celebratory voice to express the intention.',
        'When feeling celebratory, keep the pacing generous.',
        'Celebratory energy pairs well with contrasting punctuation.',
        'Invite a celebratory ally to review the result.',
        'Channel a cautionary voice to express the intention.',
        'When feeling cautionary, keep the pacing generous.',
        'Cautionary energy pairs well with contrasting punctuation.',
        'Invite a cautionary ally to review the result.',
        'Channel a neutral voice to express the intention.',
        'When feeling neutral, keep the pacing generous.',
        'Neutral energy pairs well with contrasting punctuation.',
        'Invite a neutral ally to review the result.'
],
        defaultConfig: {
    intensity: 'informative',
    motif: 'callout',
    divider: '---',
    maxItems: 6,
    appendNotes: true
},
        form: [
        {
            key: 'intensity',
            label: 'Tone intensity',
            type: 'select',
            options: [
        {
            value: 'informative',
            label: 'Informative'
        },
        {
            value: 'urgent',
            label: 'Urgent'
        },
        {
            value: 'celebratory',
            label: 'Celebratory'
        },
        {
            value: 'cautionary',
            label: 'Cautionary'
        },
        {
            value: 'neutral',
            label: 'Neutral'
        }
]
        },
        {
            key: 'motif',
            label: 'Motif',
            type: 'select',
            options: [
        {
            value: 'callout',
            label: 'Callout'
        },
        {
            value: 'spotlight',
            label: 'Spotlight'
        },
        {
            value: 'safety',
            label: 'Safety'
        },
        {
            value: 'celebration',
            label: 'Celebration'
        },
        {
            value: 'reminder',
            label: 'Reminder'
        }
]
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            min: 1,
            placeholder: '6'
        },
        {
            key: 'divider',
            label: 'Divider',
            type: 'text',
            placeholder: '---'
        },
        {
            key: 'appendNotes',
            label: 'Append creative notes',
            type: 'checkbox'
        }
]
    },
    {
        id: 'extended-action-bullet-painter',
        category: 'action',
        name: 'Bullet painter',
        description: 'Transform text into multi-level bullet structures with emphasised keywords.',
        icon: 'list',
        accent: '#14b8a6',
        tags: [
        'action',
        'format',
        'list'
],
        mode: 'transform',
        operation: 'bullets',
        motifs: [
        'highlight',
        'progress',
        'evidence',
        'celebration',
        'question'
],
        patterns: [
        'Top-level headline that references {motif}.',
        'Elaborate on top-level with a vivid detail about {motif}.',
        'Describe the tension surrounding top-level and {motif}.',
        'Outline a support move linked to top-level and {motif}.',
        'Suggest a celebratory note for top-level celebrating {motif}.',
        'Document a follow-up action for top-level anchored in {motif}.',
        'Details headline that references {motif}.',
        'Elaborate on details with a vivid detail about {motif}.',
        'Describe the tension surrounding details and {motif}.',
        'Outline a support move linked to details and {motif}.',
        'Suggest a celebratory note for details celebrating {motif}.',
        'Document a follow-up action for details anchored in {motif}.',
        'Signals headline that references {motif}.',
        'Elaborate on signals with a vivid detail about {motif}.',
        'Describe the tension surrounding signals and {motif}.',
        'Outline a support move linked to signals and {motif}.',
        'Suggest a celebratory note for signals celebrating {motif}.',
        'Document a follow-up action for signals anchored in {motif}.',
        'Risks headline that references {motif}.',
        'Elaborate on risks with a vivid detail about {motif}.',
        'Describe the tension surrounding risks and {motif}.',
        'Outline a support move linked to risks and {motif}.',
        'Suggest a celebratory note for risks celebrating {motif}.',
        'Document a follow-up action for risks anchored in {motif}.',
        'Opportunities headline that references {motif}.',
        'Elaborate on opportunities with a vivid detail about {motif}.',
        'Describe the tension surrounding opportunities and {motif}.',
        'Outline a support move linked to opportunities and {motif}.',
        'Suggest a celebratory note for opportunities celebrating {motif}.',
        'Document a follow-up action for opportunities anchored in {motif}.',
        'Questions headline that references {motif}.',
        'Elaborate on questions with a vivid detail about {motif}.',
        'Describe the tension surrounding questions and {motif}.',
        'Outline a support move linked to questions and {motif}.',
        'Suggest a celebratory note for questions celebrating {motif}.',
        'Document a follow-up action for questions anchored in {motif}.'
],
        hints: [
        'Channel a structured voice to express the intention.',
        'When feeling structured, keep the pacing generous.',
        'Structured energy pairs well with contrasting punctuation.',
        'Invite a structured ally to review the result.',
        'Channel a playful voice to express the intention.',
        'When feeling playful, keep the pacing generous.',
        'Playful energy pairs well with contrasting punctuation.',
        'Invite a playful ally to review the result.',
        'Channel a minimal voice to express the intention.',
        'When feeling minimal, keep the pacing generous.',
        'Minimal energy pairs well with contrasting punctuation.',
        'Invite a minimal ally to review the result.',
        'Channel a expressive voice to express the intention.',
        'When feeling expressive, keep the pacing generous.',
        'Expressive energy pairs well with contrasting punctuation.',
        'Invite a expressive ally to review the result.',
        'Channel a balanced voice to express the intention.',
        'When feeling balanced, keep the pacing generous.',
        'Balanced energy pairs well with contrasting punctuation.',
        'Invite a balanced ally to review the result.'
],
        defaultConfig: {
    intensity: 'structured',
    motif: 'highlight',
    divider: '---',
    maxItems: 6,
    appendNotes: true
},
        form: [
        {
            key: 'intensity',
            label: 'Tone intensity',
            type: 'select',
            options: [
        {
            value: 'structured',
            label: 'Structured'
        },
        {
            value: 'playful',
            label: 'Playful'
        },
        {
            value: 'minimal',
            label: 'Minimal'
        },
        {
            value: 'expressive',
            label: 'Expressive'
        },
        {
            value: 'balanced',
            label: 'Balanced'
        }
]
        },
        {
            key: 'motif',
            label: 'Motif',
            type: 'select',
            options: [
        {
            value: 'highlight',
            label: 'Highlight'
        },
        {
            value: 'progress',
            label: 'Progress'
        },
        {
            value: 'evidence',
            label: 'Evidence'
        },
        {
            value: 'celebration',
            label: 'Celebration'
        },
        {
            value: 'question',
            label: 'Question'
        }
]
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            min: 1,
            placeholder: '6'
        },
        {
            key: 'divider',
            label: 'Divider',
            type: 'text',
            placeholder: '---'
        },
        {
            key: 'appendNotes',
            label: 'Append creative notes',
            type: 'checkbox'
        }
]
    },
    {
        id: 'extended-action-table-framer',
        category: 'action',
        name: 'Table framer',
        description: 'Arrange payload lines into a markdown table with labelled columns.',
        icon: 'grid',
        accent: '#f97316',
        tags: [
        'action',
        'format',
        'table'
],
        mode: 'transform',
        operation: 'table',
        motifs: [
        'column',
        'evidence',
        'category',
        'metric',
        'owner'
],
        patterns: [
        'Column A headline that references {motif}.',
        'Elaborate on column a with a vivid detail about {motif}.',
        'Describe the tension surrounding column a and {motif}.',
        'Outline a support move linked to column a and {motif}.',
        'Suggest a celebratory note for column a celebrating {motif}.',
        'Document a follow-up action for column a anchored in {motif}.',
        'Column B headline that references {motif}.',
        'Elaborate on column b with a vivid detail about {motif}.',
        'Describe the tension surrounding column b and {motif}.',
        'Outline a support move linked to column b and {motif}.',
        'Suggest a celebratory note for column b celebrating {motif}.',
        'Document a follow-up action for column b anchored in {motif}.',
        'Column C headline that references {motif}.',
        'Elaborate on column c with a vivid detail about {motif}.',
        'Describe the tension surrounding column c and {motif}.',
        'Outline a support move linked to column c and {motif}.',
        'Suggest a celebratory note for column c celebrating {motif}.',
        'Document a follow-up action for column c anchored in {motif}.',
        'Insights headline that references {motif}.',
        'Elaborate on insights with a vivid detail about {motif}.',
        'Describe the tension surrounding insights and {motif}.',
        'Outline a support move linked to insights and {motif}.',
        'Suggest a celebratory note for insights celebrating {motif}.',
        'Document a follow-up action for insights anchored in {motif}.',
        'Notes headline that references {motif}.',
        'Elaborate on notes with a vivid detail about {motif}.',
        'Describe the tension surrounding notes and {motif}.',
        'Outline a support move linked to notes and {motif}.',
        'Suggest a celebratory note for notes celebrating {motif}.',
        'Document a follow-up action for notes anchored in {motif}.',
        'Owner headline that references {motif}.',
        'Elaborate on owner with a vivid detail about {motif}.',
        'Describe the tension surrounding owner and {motif}.',
        'Outline a support move linked to owner and {motif}.',
        'Suggest a celebratory note for owner celebrating {motif}.',
        'Document a follow-up action for owner anchored in {motif}.'
],
        hints: [
        'Channel a analytical voice to express the intention.',
        'When feeling analytical, keep the pacing generous.',
        'Analytical energy pairs well with contrasting punctuation.',
        'Invite a analytical ally to review the result.',
        'Channel a balanced voice to express the intention.',
        'When feeling balanced, keep the pacing generous.',
        'Balanced energy pairs well with contrasting punctuation.',
        'Invite a balanced ally to review the result.',
        'Channel a casual voice to express the intention.',
        'When feeling casual, keep the pacing generous.',
        'Casual energy pairs well with contrasting punctuation.',
        'Invite a casual ally to review the result.',
        'Channel a detailed voice to express the intention.',
        'When feeling detailed, keep the pacing generous.',
        'Detailed energy pairs well with contrasting punctuation.',
        'Invite a detailed ally to review the result.',
        'Channel a tidy voice to express the intention.',
        'When feeling tidy, keep the pacing generous.',
        'Tidy energy pairs well with contrasting punctuation.',
        'Invite a tidy ally to review the result.'
],
        defaultConfig: {
    intensity: 'analytical',
    motif: 'column',
    divider: '---',
    maxItems: 6,
    appendNotes: true
},
        form: [
        {
            key: 'intensity',
            label: 'Tone intensity',
            type: 'select',
            options: [
        {
            value: 'analytical',
            label: 'Analytical'
        },
        {
            value: 'balanced',
            label: 'Balanced'
        },
        {
            value: 'casual',
            label: 'Casual'
        },
        {
            value: 'detailed',
            label: 'Detailed'
        },
        {
            value: 'tidy',
            label: 'Tidy'
        }
]
        },
        {
            key: 'motif',
            label: 'Motif',
            type: 'select',
            options: [
        {
            value: 'column',
            label: 'Column'
        },
        {
            value: 'evidence',
            label: 'Evidence'
        },
        {
            value: 'category',
            label: 'Category'
        },
        {
            value: 'metric',
            label: 'Metric'
        },
        {
            value: 'owner',
            label: 'Owner'
        }
]
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            min: 1,
            placeholder: '6'
        },
        {
            key: 'divider',
            label: 'Divider',
            type: 'text',
            placeholder: '---'
        },
        {
            key: 'appendNotes',
            label: 'Append creative notes',
            type: 'checkbox'
        }
]
    },
    {
        id: 'extended-action-divider-weaver',
        category: 'action',
        name: 'Divider weaver',
        description: 'Insert ornamental dividers between sections for rhythm and emphasis.',
        icon: 'slash',
        accent: '#facc15',
        tags: [
        'action',
        'format',
        'divider'
],
        mode: 'transform',
        operation: 'divider',
        motifs: [
        'spark',
        'wave',
        'focus',
        'signal',
        'trail'
],
        patterns: [
        'Divider headline that references {motif}.',
        'Elaborate on divider with a vivid detail about {motif}.',
        'Describe the tension surrounding divider and {motif}.',
        'Outline a support move linked to divider and {motif}.',
        'Suggest a celebratory note for divider celebrating {motif}.',
        'Document a follow-up action for divider anchored in {motif}.',
        'Spacing headline that references {motif}.',
        'Elaborate on spacing with a vivid detail about {motif}.',
        'Describe the tension surrounding spacing and {motif}.',
        'Outline a support move linked to spacing and {motif}.',
        'Suggest a celebratory note for spacing celebrating {motif}.',
        'Document a follow-up action for spacing anchored in {motif}.',
        'Motif headline that references {motif}.',
        'Elaborate on motif with a vivid detail about {motif}.',
        'Describe the tension surrounding motif and {motif}.',
        'Outline a support move linked to motif and {motif}.',
        'Suggest a celebratory note for motif celebrating {motif}.',
        'Document a follow-up action for motif anchored in {motif}.',
        'Emphasis headline that references {motif}.',
        'Elaborate on emphasis with a vivid detail about {motif}.',
        'Describe the tension surrounding emphasis and {motif}.',
        'Outline a support move linked to emphasis and {motif}.',
        'Suggest a celebratory note for emphasis celebrating {motif}.',
        'Document a follow-up action for emphasis anchored in {motif}.',
        'Transition headline that references {motif}.',
        'Elaborate on transition with a vivid detail about {motif}.',
        'Describe the tension surrounding transition and {motif}.',
        'Outline a support move linked to transition and {motif}.',
        'Suggest a celebratory note for transition celebrating {motif}.',
        'Document a follow-up action for transition anchored in {motif}.',
        'Signature headline that references {motif}.',
        'Elaborate on signature with a vivid detail about {motif}.',
        'Describe the tension surrounding signature and {motif}.',
        'Outline a support move linked to signature and {motif}.',
        'Suggest a celebratory note for signature celebrating {motif}.',
        'Document a follow-up action for signature anchored in {motif}.'
],
        hints: [
        'Channel a subtle voice to express the intention.',
        'When feeling subtle, keep the pacing generous.',
        'Subtle energy pairs well with contrasting punctuation.',
        'Invite a subtle ally to review the result.',
        'Channel a bold voice to express the intention.',
        'When feeling bold, keep the pacing generous.',
        'Bold energy pairs well with contrasting punctuation.',
        'Invite a bold ally to review the result.',
        'Channel a whimsical voice to express the intention.',
        'When feeling whimsical, keep the pacing generous.',
        'Whimsical energy pairs well with contrasting punctuation.',
        'Invite a whimsical ally to review the result.',
        'Channel a precise voice to express the intention.',
        'When feeling precise, keep the pacing generous.',
        'Precise energy pairs well with contrasting punctuation.',
        'Invite a precise ally to review the result.',
        'Channel a calm voice to express the intention.',
        'When feeling calm, keep the pacing generous.',
        'Calm energy pairs well with contrasting punctuation.',
        'Invite a calm ally to review the result.'
],
        defaultConfig: {
    intensity: 'subtle',
    motif: 'spark',
    divider: '---',
    maxItems: 6,
    appendNotes: true
},
        form: [
        {
            key: 'intensity',
            label: 'Tone intensity',
            type: 'select',
            options: [
        {
            value: 'subtle',
            label: 'Subtle'
        },
        {
            value: 'bold',
            label: 'Bold'
        },
        {
            value: 'whimsical',
            label: 'Whimsical'
        },
        {
            value: 'precise',
            label: 'Precise'
        },
        {
            value: 'calm',
            label: 'Calm'
        }
]
        },
        {
            key: 'motif',
            label: 'Motif',
            type: 'select',
            options: [
        {
            value: 'spark',
            label: 'Spark'
        },
        {
            value: 'wave',
            label: 'Wave'
        },
        {
            value: 'focus',
            label: 'Focus'
        },
        {
            value: 'signal',
            label: 'Signal'
        },
        {
            value: 'trail',
            label: 'Trail'
        }
]
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            min: 1,
            placeholder: '6'
        },
        {
            key: 'divider',
            label: 'Divider',
            type: 'text',
            placeholder: '---'
        },
        {
            key: 'appendNotes',
            label: 'Append creative notes',
            type: 'checkbox'
        }
]
    },
    {
        id: 'extended-action-keyword-highlighter',
        category: 'action',
        name: 'Keyword highlighter',
        description: 'Highlight chosen keywords with uppercase markers and annotations.',
        icon: 'highlighter',
        accent: '#22c55e',
        tags: [
        'action',
        'text',
        'highlight'
],
        mode: 'transform',
        operation: 'highlight',
        motifs: [
        'keyword',
        'spotlight',
        'callout',
        'celebrate',
        'attention'
],
        patterns: [
        'Keyword headline that references {motif}.',
        'Elaborate on keyword with a vivid detail about {motif}.',
        'Describe the tension surrounding keyword and {motif}.',
        'Outline a support move linked to keyword and {motif}.',
        'Suggest a celebratory note for keyword celebrating {motif}.',
        'Document a follow-up action for keyword anchored in {motif}.',
        'Reason headline that references {motif}.',
        'Elaborate on reason with a vivid detail about {motif}.',
        'Describe the tension surrounding reason and {motif}.',
        'Outline a support move linked to reason and {motif}.',
        'Suggest a celebratory note for reason celebrating {motif}.',
        'Document a follow-up action for reason anchored in {motif}.',
        'Emotion headline that references {motif}.',
        'Elaborate on emotion with a vivid detail about {motif}.',
        'Describe the tension surrounding emotion and {motif}.',
        'Outline a support move linked to emotion and {motif}.',
        'Suggest a celebratory note for emotion celebrating {motif}.',
        'Document a follow-up action for emotion anchored in {motif}.',
        'Impact headline that references {motif}.',
        'Elaborate on impact with a vivid detail about {motif}.',
        'Describe the tension surrounding impact and {motif}.',
        'Outline a support move linked to impact and {motif}.',
        'Suggest a celebratory note for impact celebrating {motif}.',
        'Document a follow-up action for impact anchored in {motif}.',
        'Action headline that references {motif}.',
        'Elaborate on action with a vivid detail about {motif}.',
        'Describe the tension surrounding action and {motif}.',
        'Outline a support move linked to action and {motif}.',
        'Suggest a celebratory note for action celebrating {motif}.',
        'Document a follow-up action for action anchored in {motif}.',
        'Note headline that references {motif}.',
        'Elaborate on note with a vivid detail about {motif}.',
        'Describe the tension surrounding note and {motif}.',
        'Outline a support move linked to note and {motif}.',
        'Suggest a celebratory note for note celebrating {motif}.',
        'Document a follow-up action for note anchored in {motif}.'
],
        hints: [
        'Channel a vivid voice to express the intention.',
        'When feeling vivid, keep the pacing generous.',
        'Vivid energy pairs well with contrasting punctuation.',
        'Invite a vivid ally to review the result.',
        'Channel a practical voice to express the intention.',
        'When feeling practical, keep the pacing generous.',
        'Practical energy pairs well with contrasting punctuation.',
        'Invite a practical ally to review the result.',
        'Channel a joyful voice to express the intention.',
        'When feeling joyful, keep the pacing generous.',
        'Joyful energy pairs well with contrasting punctuation.',
        'Invite a joyful ally to review the result.',
        'Channel a intense voice to express the intention.',
        'When feeling intense, keep the pacing generous.',
        'Intense energy pairs well with contrasting punctuation.',
        'Invite a intense ally to review the result.',
        'Channel a calm voice to express the intention.',
        'When feeling calm, keep the pacing generous.',
        'Calm energy pairs well with contrasting punctuation.',
        'Invite a calm ally to review the result.'
],
        defaultConfig: {
    intensity: 'vivid',
    motif: 'keyword',
    divider: '---',
    maxItems: 6,
    appendNotes: true
},
        form: [
        {
            key: 'intensity',
            label: 'Tone intensity',
            type: 'select',
            options: [
        {
            value: 'vivid',
            label: 'Vivid'
        },
        {
            value: 'practical',
            label: 'Practical'
        },
        {
            value: 'joyful',
            label: 'Joyful'
        },
        {
            value: 'intense',
            label: 'Intense'
        },
        {
            value: 'calm',
            label: 'Calm'
        }
]
        },
        {
            key: 'motif',
            label: 'Motif',
            type: 'select',
            options: [
        {
            value: 'keyword',
            label: 'Keyword'
        },
        {
            value: 'spotlight',
            label: 'Spotlight'
        },
        {
            value: 'callout',
            label: 'Callout'
        },
        {
            value: 'celebrate',
            label: 'Celebrate'
        },
        {
            value: 'attention',
            label: 'Attention'
        }
]
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            min: 1,
            placeholder: '6'
        },
        {
            key: 'divider',
            label: 'Divider',
            type: 'text',
            placeholder: '---'
        },
        {
            key: 'appendNotes',
            label: 'Append creative notes',
            type: 'checkbox'
        }
]
    },
    {
        id: 'extended-action-question-forge',
        category: 'action',
        name: 'Question forge',
        description: 'Inject exploratory questions that prompt deeper thinking around the payload.',
        icon: 'help-circle',
        accent: '#6366f1',
        tags: [
        'action',
        'question',
        'insight'
],
        mode: 'transform',
        operation: 'questions',
        motifs: [
        'why',
        'how',
        'what if',
        'evidence',
        'impact'
],
        patterns: [
        'Perspective headline that references {motif}.',
        'Elaborate on perspective with a vivid detail about {motif}.',
        'Describe the tension surrounding perspective and {motif}.',
        'Outline a support move linked to perspective and {motif}.',
        'Suggest a celebratory note for perspective celebrating {motif}.',
        'Document a follow-up action for perspective anchored in {motif}.',
        'Details headline that references {motif}.',
        'Elaborate on details with a vivid detail about {motif}.',
        'Describe the tension surrounding details and {motif}.',
        'Outline a support move linked to details and {motif}.',
        'Suggest a celebratory note for details celebrating {motif}.',
        'Document a follow-up action for details anchored in {motif}.',
        'Risks headline that references {motif}.',
        'Elaborate on risks with a vivid detail about {motif}.',
        'Describe the tension surrounding risks and {motif}.',
        'Outline a support move linked to risks and {motif}.',
        'Suggest a celebratory note for risks celebrating {motif}.',
        'Document a follow-up action for risks anchored in {motif}.',
        'Opportunities headline that references {motif}.',
        'Elaborate on opportunities with a vivid detail about {motif}.',
        'Describe the tension surrounding opportunities and {motif}.',
        'Outline a support move linked to opportunities and {motif}.',
        'Suggest a celebratory note for opportunities celebrating {motif}.',
        'Document a follow-up action for opportunities anchored in {motif}.',
        'Support headline that references {motif}.',
        'Elaborate on support with a vivid detail about {motif}.',
        'Describe the tension surrounding support and {motif}.',
        'Outline a support move linked to support and {motif}.',
        'Suggest a celebratory note for support celebrating {motif}.',
        'Document a follow-up action for support anchored in {motif}.',
        'Success headline that references {motif}.',
        'Elaborate on success with a vivid detail about {motif}.',
        'Describe the tension surrounding success and {motif}.',
        'Outline a support move linked to success and {motif}.',
        'Suggest a celebratory note for success celebrating {motif}.',
        'Document a follow-up action for success anchored in {motif}.'
],
        hints: [
        'Channel a curious voice to express the intention.',
        'When feeling curious, keep the pacing generous.',
        'Curious energy pairs well with contrasting punctuation.',
        'Invite a curious ally to review the result.',
        'Channel a provocative voice to express the intention.',
        'When feeling provocative, keep the pacing generous.',
        'Provocative energy pairs well with contrasting punctuation.',
        'Invite a provocative ally to review the result.',
        'Channel a gentle voice to express the intention.',
        'When feeling gentle, keep the pacing generous.',
        'Gentle energy pairs well with contrasting punctuation.',
        'Invite a gentle ally to review the result.',
        'Channel a analytical voice to express the intention.',
        'When feeling analytical, keep the pacing generous.',
        'Analytical energy pairs well with contrasting punctuation.',
        'Invite a analytical ally to review the result.',
        'Channel a supportive voice to express the intention.',
        'When feeling supportive, keep the pacing generous.',
        'Supportive energy pairs well with contrasting punctuation.',
        'Invite a supportive ally to review the result.'
],
        defaultConfig: {
    intensity: 'curious',
    motif: 'why',
    divider: '---',
    maxItems: 6,
    appendNotes: true
},
        form: [
        {
            key: 'intensity',
            label: 'Tone intensity',
            type: 'select',
            options: [
        {
            value: 'curious',
            label: 'Curious'
        },
        {
            value: 'provocative',
            label: 'Provocative'
        },
        {
            value: 'gentle',
            label: 'Gentle'
        },
        {
            value: 'analytical',
            label: 'Analytical'
        },
        {
            value: 'supportive',
            label: 'Supportive'
        }
]
        },
        {
            key: 'motif',
            label: 'Motif',
            type: 'select',
            options: [
        {
            value: 'why',
            label: 'Why'
        },
        {
            value: 'how',
            label: 'How'
        },
        {
            value: 'what-if',
            label: 'What If'
        },
        {
            value: 'evidence',
            label: 'Evidence'
        },
        {
            value: 'impact',
            label: 'Impact'
        }
]
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            min: 1,
            placeholder: '6'
        },
        {
            key: 'divider',
            label: 'Divider',
            type: 'text',
            placeholder: '---'
        },
        {
            key: 'appendNotes',
            label: 'Append creative notes',
            type: 'checkbox'
        }
]
    },
    {
        id: 'extended-action-storybeat-mapper',
        category: 'action',
        name: 'Storybeat mapper',
        description: 'Break the payload into story beats with mood and pacing cues.',
        icon: 'film',
        accent: '#ef4444',
        tags: [
        'action',
        'story',
        'structure'
],
        mode: 'transform',
        operation: 'storybeats',
        motifs: [
        'opening',
        'tension',
        'reveal',
        'resolution',
        'epilogue'
],
        patterns: [
        'Beat headline that references {motif}.',
        'Elaborate on beat with a vivid detail about {motif}.',
        'Describe the tension surrounding beat and {motif}.',
        'Outline a support move linked to beat and {motif}.',
        'Suggest a celebratory note for beat celebrating {motif}.',
        'Document a follow-up action for beat anchored in {motif}.',
        'Mood headline that references {motif}.',
        'Elaborate on mood with a vivid detail about {motif}.',
        'Describe the tension surrounding mood and {motif}.',
        'Outline a support move linked to mood and {motif}.',
        'Suggest a celebratory note for mood celebrating {motif}.',
        'Document a follow-up action for mood anchored in {motif}.',
        'Pace headline that references {motif}.',
        'Elaborate on pace with a vivid detail about {motif}.',
        'Describe the tension surrounding pace and {motif}.',
        'Outline a support move linked to pace and {motif}.',
        'Suggest a celebratory note for pace celebrating {motif}.',
        'Document a follow-up action for pace anchored in {motif}.',
        'Character headline that references {motif}.',
        'Elaborate on character with a vivid detail about {motif}.',
        'Describe the tension surrounding character and {motif}.',
        'Outline a support move linked to character and {motif}.',
        'Suggest a celebratory note for character celebrating {motif}.',
        'Document a follow-up action for character anchored in {motif}.',
        'Scene headline that references {motif}.',
        'Elaborate on scene with a vivid detail about {motif}.',
        'Describe the tension surrounding scene and {motif}.',
        'Outline a support move linked to scene and {motif}.',
        'Suggest a celebratory note for scene celebrating {motif}.',
        'Document a follow-up action for scene anchored in {motif}.',
        'Action headline that references {motif}.',
        'Elaborate on action with a vivid detail about {motif}.',
        'Describe the tension surrounding action and {motif}.',
        'Outline a support move linked to action and {motif}.',
        'Suggest a celebratory note for action celebrating {motif}.',
        'Document a follow-up action for action anchored in {motif}.'
],
        hints: [
        'Channel a dramatic voice to express the intention.',
        'When feeling dramatic, keep the pacing generous.',
        'Dramatic energy pairs well with contrasting punctuation.',
        'Invite a dramatic ally to review the result.',
        'Channel a uplifting voice to express the intention.',
        'When feeling uplifting, keep the pacing generous.',
        'Uplifting energy pairs well with contrasting punctuation.',
        'Invite a uplifting ally to review the result.',
        'Channel a calm voice to express the intention.',
        'When feeling calm, keep the pacing generous.',
        'Calm energy pairs well with contrasting punctuation.',
        'Invite a calm ally to review the result.',
        'Channel a thrilling voice to express the intention.',
        'When feeling thrilling, keep the pacing generous.',
        'Thrilling energy pairs well with contrasting punctuation.',
        'Invite a thrilling ally to review the result.',
        'Channel a gentle voice to express the intention.',
        'When feeling gentle, keep the pacing generous.',
        'Gentle energy pairs well with contrasting punctuation.',
        'Invite a gentle ally to review the result.'
],
        defaultConfig: {
    intensity: 'dramatic',
    motif: 'opening',
    divider: '---',
    maxItems: 6,
    appendNotes: true
},
        form: [
        {
            key: 'intensity',
            label: 'Tone intensity',
            type: 'select',
            options: [
        {
            value: 'dramatic',
            label: 'Dramatic'
        },
        {
            value: 'uplifting',
            label: 'Uplifting'
        },
        {
            value: 'calm',
            label: 'Calm'
        },
        {
            value: 'thrilling',
            label: 'Thrilling'
        },
        {
            value: 'gentle',
            label: 'Gentle'
        }
]
        },
        {
            key: 'motif',
            label: 'Motif',
            type: 'select',
            options: [
        {
            value: 'opening',
            label: 'Opening'
        },
        {
            value: 'tension',
            label: 'Tension'
        },
        {
            value: 'reveal',
            label: 'Reveal'
        },
        {
            value: 'resolution',
            label: 'Resolution'
        },
        {
            value: 'epilogue',
            label: 'Epilogue'
        }
]
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            min: 1,
            placeholder: '6'
        },
        {
            key: 'divider',
            label: 'Divider',
            type: 'text',
            placeholder: '---'
        },
        {
            key: 'appendNotes',
            label: 'Append creative notes',
            type: 'checkbox'
        }
]
    },
    {
        id: 'extended-action-contrast-lens',
        category: 'action',
        name: 'Contrast lens',
        description: 'Frame contrast pairs (before/after, risk/reward) to sharpen the narrative.',
        icon: 'toggle-left',
        accent: '#0ea5e9',
        tags: [
        'action',
        'analysis',
        'contrast'
],
        mode: 'transform',
        operation: 'contrast',
        motifs: [
        'before',
        'after',
        'risk',
        'reward',
        'confidence'
],
        patterns: [
        'Contrast headline that references {motif}.',
        'Elaborate on contrast with a vivid detail about {motif}.',
        'Describe the tension surrounding contrast and {motif}.',
        'Outline a support move linked to contrast and {motif}.',
        'Suggest a celebratory note for contrast celebrating {motif}.',
        'Document a follow-up action for contrast anchored in {motif}.',
        'Snapshot headline that references {motif}.',
        'Elaborate on snapshot with a vivid detail about {motif}.',
        'Describe the tension surrounding snapshot and {motif}.',
        'Outline a support move linked to snapshot and {motif}.',
        'Suggest a celebratory note for snapshot celebrating {motif}.',
        'Document a follow-up action for snapshot anchored in {motif}.',
        'Signal headline that references {motif}.',
        'Elaborate on signal with a vivid detail about {motif}.',
        'Describe the tension surrounding signal and {motif}.',
        'Outline a support move linked to signal and {motif}.',
        'Suggest a celebratory note for signal celebrating {motif}.',
        'Document a follow-up action for signal anchored in {motif}.',
        'Impact headline that references {motif}.',
        'Elaborate on impact with a vivid detail about {motif}.',
        'Describe the tension surrounding impact and {motif}.',
        'Outline a support move linked to impact and {motif}.',
        'Suggest a celebratory note for impact celebrating {motif}.',
        'Document a follow-up action for impact anchored in {motif}.',
        'Mitigation headline that references {motif}.',
        'Elaborate on mitigation with a vivid detail about {motif}.',
        'Describe the tension surrounding mitigation and {motif}.',
        'Outline a support move linked to mitigation and {motif}.',
        'Suggest a celebratory note for mitigation celebrating {motif}.',
        'Document a follow-up action for mitigation anchored in {motif}.',
        'Momentum headline that references {motif}.',
        'Elaborate on momentum with a vivid detail about {motif}.',
        'Describe the tension surrounding momentum and {motif}.',
        'Outline a support move linked to momentum and {motif}.',
        'Suggest a celebratory note for momentum celebrating {motif}.',
        'Document a follow-up action for momentum anchored in {motif}.'
],
        hints: [
        'Channel a analytical voice to express the intention.',
        'When feeling analytical, keep the pacing generous.',
        'Analytical energy pairs well with contrasting punctuation.',
        'Invite a analytical ally to review the result.',
        'Channel a upbeat voice to express the intention.',
        'When feeling upbeat, keep the pacing generous.',
        'Upbeat energy pairs well with contrasting punctuation.',
        'Invite a upbeat ally to review the result.',
        'Channel a cautious voice to express the intention.',
        'When feeling cautious, keep the pacing generous.',
        'Cautious energy pairs well with contrasting punctuation.',
        'Invite a cautious ally to review the result.',
        'Channel a confident voice to express the intention.',
        'When feeling confident, keep the pacing generous.',
        'Confident energy pairs well with contrasting punctuation.',
        'Invite a confident ally to review the result.',
        'Channel a playful voice to express the intention.',
        'When feeling playful, keep the pacing generous.',
        'Playful energy pairs well with contrasting punctuation.',
        'Invite a playful ally to review the result.'
],
        defaultConfig: {
    intensity: 'analytical',
    motif: 'before',
    divider: '---',
    maxItems: 6,
    appendNotes: true
},
        form: [
        {
            key: 'intensity',
            label: 'Tone intensity',
            type: 'select',
            options: [
        {
            value: 'analytical',
            label: 'Analytical'
        },
        {
            value: 'upbeat',
            label: 'Upbeat'
        },
        {
            value: 'cautious',
            label: 'Cautious'
        },
        {
            value: 'confident',
            label: 'Confident'
        },
        {
            value: 'playful',
            label: 'Playful'
        }
]
        },
        {
            key: 'motif',
            label: 'Motif',
            type: 'select',
            options: [
        {
            value: 'before',
            label: 'Before'
        },
        {
            value: 'after',
            label: 'After'
        },
        {
            value: 'risk',
            label: 'Risk'
        },
        {
            value: 'reward',
            label: 'Reward'
        },
        {
            value: 'confidence',
            label: 'Confidence'
        }
]
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            min: 1,
            placeholder: '6'
        },
        {
            key: 'divider',
            label: 'Divider',
            type: 'text',
            placeholder: '---'
        },
        {
            key: 'appendNotes',
            label: 'Append creative notes',
            type: 'checkbox'
        }
]
    },
    {
        id: 'extended-action-insight-notes',
        category: 'action',
        name: 'Insight notepad',
        description: 'Capture insights, surprises, and follow-ups derived from the payload.',
        icon: 'edit-3',
        accent: '#22d3ee',
        tags: [
        'action',
        'insight',
        'note'
],
        mode: 'transform',
        operation: 'insights',
        motifs: [
        'insight',
        'surprise',
        'question',
        'bet',
        'follow-up'
],
        patterns: [
        'Observation headline that references {motif}.',
        'Elaborate on observation with a vivid detail about {motif}.',
        'Describe the tension surrounding observation and {motif}.',
        'Outline a support move linked to observation and {motif}.',
        'Suggest a celebratory note for observation celebrating {motif}.',
        'Document a follow-up action for observation anchored in {motif}.',
        'Why it matters headline that references {motif}.',
        'Elaborate on why it matters with a vivid detail about {motif}.',
        'Describe the tension surrounding why it matters and {motif}.',
        'Outline a support move linked to why it matters and {motif}.',
        'Suggest a celebratory note for why it matters celebrating {motif}.',
        'Document a follow-up action for why it matters anchored in {motif}.',
        'Evidence headline that references {motif}.',
        'Elaborate on evidence with a vivid detail about {motif}.',
        'Describe the tension surrounding evidence and {motif}.',
        'Outline a support move linked to evidence and {motif}.',
        'Suggest a celebratory note for evidence celebrating {motif}.',
        'Document a follow-up action for evidence anchored in {motif}.',
        'Next step headline that references {motif}.',
        'Elaborate on next step with a vivid detail about {motif}.',
        'Describe the tension surrounding next step and {motif}.',
        'Outline a support move linked to next step and {motif}.',
        'Suggest a celebratory note for next step celebrating {motif}.',
        'Document a follow-up action for next step anchored in {motif}.',
        'Owner headline that references {motif}.',
        'Elaborate on owner with a vivid detail about {motif}.',
        'Describe the tension surrounding owner and {motif}.',
        'Outline a support move linked to owner and {motif}.',
        'Suggest a celebratory note for owner celebrating {motif}.',
        'Document a follow-up action for owner anchored in {motif}.',
        'Timeline headline that references {motif}.',
        'Elaborate on timeline with a vivid detail about {motif}.',
        'Describe the tension surrounding timeline and {motif}.',
        'Outline a support move linked to timeline and {motif}.',
        'Suggest a celebratory note for timeline celebrating {motif}.',
        'Document a follow-up action for timeline anchored in {motif}.'
],
        hints: [
        'Channel a reflective voice to express the intention.',
        'When feeling reflective, keep the pacing generous.',
        'Reflective energy pairs well with contrasting punctuation.',
        'Invite a reflective ally to review the result.',
        'Channel a excited voice to express the intention.',
        'When feeling excited, keep the pacing generous.',
        'Excited energy pairs well with contrasting punctuation.',
        'Invite a excited ally to review the result.',
        'Channel a balanced voice to express the intention.',
        'When feeling balanced, keep the pacing generous.',
        'Balanced energy pairs well with contrasting punctuation.',
        'Invite a balanced ally to review the result.',
        'Channel a structured voice to express the intention.',
        'When feeling structured, keep the pacing generous.',
        'Structured energy pairs well with contrasting punctuation.',
        'Invite a structured ally to review the result.',
        'Channel a hopeful voice to express the intention.',
        'When feeling hopeful, keep the pacing generous.',
        'Hopeful energy pairs well with contrasting punctuation.',
        'Invite a hopeful ally to review the result.'
],
        defaultConfig: {
    intensity: 'reflective',
    motif: 'insight',
    divider: '---',
    maxItems: 6,
    appendNotes: true
},
        form: [
        {
            key: 'intensity',
            label: 'Tone intensity',
            type: 'select',
            options: [
        {
            value: 'reflective',
            label: 'Reflective'
        },
        {
            value: 'excited',
            label: 'Excited'
        },
        {
            value: 'balanced',
            label: 'Balanced'
        },
        {
            value: 'structured',
            label: 'Structured'
        },
        {
            value: 'hopeful',
            label: 'Hopeful'
        }
]
        },
        {
            key: 'motif',
            label: 'Motif',
            type: 'select',
            options: [
        {
            value: 'insight',
            label: 'Insight'
        },
        {
            value: 'surprise',
            label: 'Surprise'
        },
        {
            value: 'question',
            label: 'Question'
        },
        {
            value: 'bet',
            label: 'Bet'
        },
        {
            value: 'follow-up',
            label: 'Follow-Up'
        }
]
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            min: 1,
            placeholder: '6'
        },
        {
            key: 'divider',
            label: 'Divider',
            type: 'text',
            placeholder: '---'
        },
        {
            key: 'appendNotes',
            label: 'Append creative notes',
            type: 'checkbox'
        }
]
    },
    {
        id: 'extended-action-checkpoint-grid',
        category: 'action',
        name: 'Checkpoint grid',
        description: 'Generate labelled checkpoints with status icons and confidence levels.',
        icon: 'check-circle',
        accent: '#16a34a',
        tags: [
        'action',
        'status',
        'planning'
],
        mode: 'transform',
        operation: 'checkpoint',
        motifs: [
        'status',
        'confidence',
        'evidence',
        'blocker',
        'boost'
],
        patterns: [
        'Checkpoint headline that references {motif}.',
        'Elaborate on checkpoint with a vivid detail about {motif}.',
        'Describe the tension surrounding checkpoint and {motif}.',
        'Outline a support move linked to checkpoint and {motif}.',
        'Suggest a celebratory note for checkpoint celebrating {motif}.',
        'Document a follow-up action for checkpoint anchored in {motif}.',
        'Status headline that references {motif}.',
        'Elaborate on status with a vivid detail about {motif}.',
        'Describe the tension surrounding status and {motif}.',
        'Outline a support move linked to status and {motif}.',
        'Suggest a celebratory note for status celebrating {motif}.',
        'Document a follow-up action for status anchored in {motif}.',
        'Confidence headline that references {motif}.',
        'Elaborate on confidence with a vivid detail about {motif}.',
        'Describe the tension surrounding confidence and {motif}.',
        'Outline a support move linked to confidence and {motif}.',
        'Suggest a celebratory note for confidence celebrating {motif}.',
        'Document a follow-up action for confidence anchored in {motif}.',
        'Evidence headline that references {motif}.',
        'Elaborate on evidence with a vivid detail about {motif}.',
        'Describe the tension surrounding evidence and {motif}.',
        'Outline a support move linked to evidence and {motif}.',
        'Suggest a celebratory note for evidence celebrating {motif}.',
        'Document a follow-up action for evidence anchored in {motif}.',
        'Support headline that references {motif}.',
        'Elaborate on support with a vivid detail about {motif}.',
        'Describe the tension surrounding support and {motif}.',
        'Outline a support move linked to support and {motif}.',
        'Suggest a celebratory note for support celebrating {motif}.',
        'Document a follow-up action for support anchored in {motif}.',
        'Next signal headline that references {motif}.',
        'Elaborate on next signal with a vivid detail about {motif}.',
        'Describe the tension surrounding next signal and {motif}.',
        'Outline a support move linked to next signal and {motif}.',
        'Suggest a celebratory note for next signal celebrating {motif}.',
        'Document a follow-up action for next signal anchored in {motif}.'
],
        hints: [
        'Channel a steady voice to express the intention.',
        'When feeling steady, keep the pacing generous.',
        'Steady energy pairs well with contrasting punctuation.',
        'Invite a steady ally to review the result.',
        'Channel a alert voice to express the intention.',
        'When feeling alert, keep the pacing generous.',
        'Alert energy pairs well with contrasting punctuation.',
        'Invite a alert ally to review the result.',
        'Channel a optimistic voice to express the intention.',
        'When feeling optimistic, keep the pacing generous.',
        'Optimistic energy pairs well with contrasting punctuation.',
        'Invite a optimistic ally to review the result.',
        'Channel a grounded voice to express the intention.',
        'When feeling grounded, keep the pacing generous.',
        'Grounded energy pairs well with contrasting punctuation.',
        'Invite a grounded ally to review the result.',
        'Channel a calm voice to express the intention.',
        'When feeling calm, keep the pacing generous.',
        'Calm energy pairs well with contrasting punctuation.',
        'Invite a calm ally to review the result.'
],
        defaultConfig: {
    intensity: 'steady',
    motif: 'status',
    divider: '---',
    maxItems: 6,
    appendNotes: true
},
        form: [
        {
            key: 'intensity',
            label: 'Tone intensity',
            type: 'select',
            options: [
        {
            value: 'steady',
            label: 'Steady'
        },
        {
            value: 'alert',
            label: 'Alert'
        },
        {
            value: 'optimistic',
            label: 'Optimistic'
        },
        {
            value: 'grounded',
            label: 'Grounded'
        },
        {
            value: 'calm',
            label: 'Calm'
        }
]
        },
        {
            key: 'motif',
            label: 'Motif',
            type: 'select',
            options: [
        {
            value: 'status',
            label: 'Status'
        },
        {
            value: 'confidence',
            label: 'Confidence'
        },
        {
            value: 'evidence',
            label: 'Evidence'
        },
        {
            value: 'blocker',
            label: 'Blocker'
        },
        {
            value: 'boost',
            label: 'Boost'
        }
]
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            min: 1,
            placeholder: '6'
        },
        {
            key: 'divider',
            label: 'Divider',
            type: 'text',
            placeholder: '---'
        },
        {
            key: 'appendNotes',
            label: 'Append creative notes',
            type: 'checkbox'
        }
]
    },
    {
        id: 'extended-action-summary-lift',
        category: 'action',
        name: 'Summary lifter',
        description: 'Produce a structured summary emphasising highlights, blockers, and asks.',
        icon: 'layers',
        accent: '#f43f5e',
        tags: [
        'action',
        'summary',
        'analysis'
],
        mode: 'transform',
        operation: 'summary',
        motifs: [
        'highlight',
        'blocker',
        'metric',
        'celebration',
        'ask'
],
        patterns: [
        'Highlight headline that references {motif}.',
        'Elaborate on highlight with a vivid detail about {motif}.',
        'Describe the tension surrounding highlight and {motif}.',
        'Outline a support move linked to highlight and {motif}.',
        'Suggest a celebratory note for highlight celebrating {motif}.',
        'Document a follow-up action for highlight anchored in {motif}.',
        'Signal headline that references {motif}.',
        'Elaborate on signal with a vivid detail about {motif}.',
        'Describe the tension surrounding signal and {motif}.',
        'Outline a support move linked to signal and {motif}.',
        'Suggest a celebratory note for signal celebrating {motif}.',
        'Document a follow-up action for signal anchored in {motif}.',
        'Blocker headline that references {motif}.',
        'Elaborate on blocker with a vivid detail about {motif}.',
        'Describe the tension surrounding blocker and {motif}.',
        'Outline a support move linked to blocker and {motif}.',
        'Suggest a celebratory note for blocker celebrating {motif}.',
        'Document a follow-up action for blocker anchored in {motif}.',
        'Metric headline that references {motif}.',
        'Elaborate on metric with a vivid detail about {motif}.',
        'Describe the tension surrounding metric and {motif}.',
        'Outline a support move linked to metric and {motif}.',
        'Suggest a celebratory note for metric celebrating {motif}.',
        'Document a follow-up action for metric anchored in {motif}.',
        'Celebration headline that references {motif}.',
        'Elaborate on celebration with a vivid detail about {motif}.',
        'Describe the tension surrounding celebration and {motif}.',
        'Outline a support move linked to celebration and {motif}.',
        'Suggest a celebratory note for celebration celebrating {motif}.',
        'Document a follow-up action for celebration anchored in {motif}.',
        'Ask headline that references {motif}.',
        'Elaborate on ask with a vivid detail about {motif}.',
        'Describe the tension surrounding ask and {motif}.',
        'Outline a support move linked to ask and {motif}.',
        'Suggest a celebratory note for ask celebrating {motif}.',
        'Document a follow-up action for ask anchored in {motif}.'
],
        hints: [
        'Channel a executive voice to express the intention.',
        'When feeling executive, keep the pacing generous.',
        'Executive energy pairs well with contrasting punctuation.',
        'Invite a executive ally to review the result.',
        'Channel a friendly voice to express the intention.',
        'When feeling friendly, keep the pacing generous.',
        'Friendly energy pairs well with contrasting punctuation.',
        'Invite a friendly ally to review the result.',
        'Channel a urgent voice to express the intention.',
        'When feeling urgent, keep the pacing generous.',
        'Urgent energy pairs well with contrasting punctuation.',
        'Invite a urgent ally to review the result.',
        'Channel a calm voice to express the intention.',
        'When feeling calm, keep the pacing generous.',
        'Calm energy pairs well with contrasting punctuation.',
        'Invite a calm ally to review the result.',
        'Channel a optimistic voice to express the intention.',
        'When feeling optimistic, keep the pacing generous.',
        'Optimistic energy pairs well with contrasting punctuation.',
        'Invite a optimistic ally to review the result.'
],
        defaultConfig: {
    intensity: 'executive',
    motif: 'highlight',
    divider: '---',
    maxItems: 6,
    appendNotes: true
},
        form: [
        {
            key: 'intensity',
            label: 'Tone intensity',
            type: 'select',
            options: [
        {
            value: 'executive',
            label: 'Executive'
        },
        {
            value: 'friendly',
            label: 'Friendly'
        },
        {
            value: 'urgent',
            label: 'Urgent'
        },
        {
            value: 'calm',
            label: 'Calm'
        },
        {
            value: 'optimistic',
            label: 'Optimistic'
        }
]
        },
        {
            key: 'motif',
            label: 'Motif',
            type: 'select',
            options: [
        {
            value: 'highlight',
            label: 'Highlight'
        },
        {
            value: 'blocker',
            label: 'Blocker'
        },
        {
            value: 'metric',
            label: 'Metric'
        },
        {
            value: 'celebration',
            label: 'Celebration'
        },
        {
            value: 'ask',
            label: 'Ask'
        }
]
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            min: 1,
            placeholder: '6'
        },
        {
            key: 'divider',
            label: 'Divider',
            type: 'text',
            placeholder: '---'
        },
        {
            key: 'appendNotes',
            label: 'Append creative notes',
            type: 'checkbox'
        }
]
    },
    {
        id: 'extended-action-timeline-weaver',
        category: 'action',
        name: 'Timeline weaver',
        description: 'Turn payload lines into a relative timeline with mood and confidence fields.',
        icon: 'activity',
        accent: '#a3e635',
        tags: [
        'action',
        'timeline',
        'planning'
],
        mode: 'transform',
        operation: 'timeline',
        motifs: [
        'start',
        'now',
        'next',
        'later',
        'celebrate'
],
        patterns: [
        'Time headline that references {motif}.',
        'Elaborate on time with a vivid detail about {motif}.',
        'Describe the tension surrounding time and {motif}.',
        'Outline a support move linked to time and {motif}.',
        'Suggest a celebratory note for time celebrating {motif}.',
        'Document a follow-up action for time anchored in {motif}.',
        'Description headline that references {motif}.',
        'Elaborate on description with a vivid detail about {motif}.',
        'Describe the tension surrounding description and {motif}.',
        'Outline a support move linked to description and {motif}.',
        'Suggest a celebratory note for description celebrating {motif}.',
        'Document a follow-up action for description anchored in {motif}.',
        'Mood headline that references {motif}.',
        'Elaborate on mood with a vivid detail about {motif}.',
        'Describe the tension surrounding mood and {motif}.',
        'Outline a support move linked to mood and {motif}.',
        'Suggest a celebratory note for mood celebrating {motif}.',
        'Document a follow-up action for mood anchored in {motif}.',
        'Confidence headline that references {motif}.',
        'Elaborate on confidence with a vivid detail about {motif}.',
        'Describe the tension surrounding confidence and {motif}.',
        'Outline a support move linked to confidence and {motif}.',
        'Suggest a celebratory note for confidence celebrating {motif}.',
        'Document a follow-up action for confidence anchored in {motif}.',
        'Owner headline that references {motif}.',
        'Elaborate on owner with a vivid detail about {motif}.',
        'Describe the tension surrounding owner and {motif}.',
        'Outline a support move linked to owner and {motif}.',
        'Suggest a celebratory note for owner celebrating {motif}.',
        'Document a follow-up action for owner anchored in {motif}.',
        'Notes headline that references {motif}.',
        'Elaborate on notes with a vivid detail about {motif}.',
        'Describe the tension surrounding notes and {motif}.',
        'Outline a support move linked to notes and {motif}.',
        'Suggest a celebratory note for notes celebrating {motif}.',
        'Document a follow-up action for notes anchored in {motif}.'
],
        hints: [
        'Channel a hopeful voice to express the intention.',
        'When feeling hopeful, keep the pacing generous.',
        'Hopeful energy pairs well with contrasting punctuation.',
        'Invite a hopeful ally to review the result.',
        'Channel a calm voice to express the intention.',
        'When feeling calm, keep the pacing generous.',
        'Calm energy pairs well with contrasting punctuation.',
        'Invite a calm ally to review the result.',
        'Channel a fast voice to express the intention.',
        'When feeling fast, keep the pacing generous.',
        'Fast energy pairs well with contrasting punctuation.',
        'Invite a fast ally to review the result.',
        'Channel a methodical voice to express the intention.',
        'When feeling methodical, keep the pacing generous.',
        'Methodical energy pairs well with contrasting punctuation.',
        'Invite a methodical ally to review the result.',
        'Channel a ambitious voice to express the intention.',
        'When feeling ambitious, keep the pacing generous.',
        'Ambitious energy pairs well with contrasting punctuation.',
        'Invite a ambitious ally to review the result.'
],
        defaultConfig: {
    intensity: 'hopeful',
    motif: 'start',
    divider: '---',
    maxItems: 6,
    appendNotes: true
},
        form: [
        {
            key: 'intensity',
            label: 'Tone intensity',
            type: 'select',
            options: [
        {
            value: 'hopeful',
            label: 'Hopeful'
        },
        {
            value: 'calm',
            label: 'Calm'
        },
        {
            value: 'fast',
            label: 'Fast'
        },
        {
            value: 'methodical',
            label: 'Methodical'
        },
        {
            value: 'ambitious',
            label: 'Ambitious'
        }
]
        },
        {
            key: 'motif',
            label: 'Motif',
            type: 'select',
            options: [
        {
            value: 'start',
            label: 'Start'
        },
        {
            value: 'now',
            label: 'Now'
        },
        {
            value: 'next',
            label: 'Next'
        },
        {
            value: 'later',
            label: 'Later'
        },
        {
            value: 'celebrate',
            label: 'Celebrate'
        }
]
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            min: 1,
            placeholder: '6'
        },
        {
            key: 'divider',
            label: 'Divider',
            type: 'text',
            placeholder: '---'
        },
        {
            key: 'appendNotes',
            label: 'Append creative notes',
            type: 'checkbox'
        }
]
    },
    {
        id: 'extended-action-signature-setter',
        category: 'action',
        name: 'Signature setter',
        description: 'Attach a closing signature with persona, contact channels, and invitation.',
        icon: 'feather',
        accent: '#f59e0b',
        tags: [
        'action',
        'closing',
        'signature'
],
        mode: 'transform',
        operation: 'signature',
        motifs: [
        'persona',
        'channel',
        'invitation',
        'thanks',
        'follow-up'
],
        patterns: [
        'Name headline that references {motif}.',
        'Elaborate on name with a vivid detail about {motif}.',
        'Describe the tension surrounding name and {motif}.',
        'Outline a support move linked to name and {motif}.',
        'Suggest a celebratory note for name celebrating {motif}.',
        'Document a follow-up action for name anchored in {motif}.',
        'Role headline that references {motif}.',
        'Elaborate on role with a vivid detail about {motif}.',
        'Describe the tension surrounding role and {motif}.',
        'Outline a support move linked to role and {motif}.',
        'Suggest a celebratory note for role celebrating {motif}.',
        'Document a follow-up action for role anchored in {motif}.',
        'Contact headline that references {motif}.',
        'Elaborate on contact with a vivid detail about {motif}.',
        'Describe the tension surrounding contact and {motif}.',
        'Outline a support move linked to contact and {motif}.',
        'Suggest a celebratory note for contact celebrating {motif}.',
        'Document a follow-up action for contact anchored in {motif}.',
        'Invitation headline that references {motif}.',
        'Elaborate on invitation with a vivid detail about {motif}.',
        'Describe the tension surrounding invitation and {motif}.',
        'Outline a support move linked to invitation and {motif}.',
        'Suggest a celebratory note for invitation celebrating {motif}.',
        'Document a follow-up action for invitation anchored in {motif}.',
        'Signature headline that references {motif}.',
        'Elaborate on signature with a vivid detail about {motif}.',
        'Describe the tension surrounding signature and {motif}.',
        'Outline a support move linked to signature and {motif}.',
        'Suggest a celebratory note for signature celebrating {motif}.',
        'Document a follow-up action for signature anchored in {motif}.',
        'PS headline that references {motif}.',
        'Elaborate on ps with a vivid detail about {motif}.',
        'Describe the tension surrounding ps and {motif}.',
        'Outline a support move linked to ps and {motif}.',
        'Suggest a celebratory note for ps celebrating {motif}.',
        'Document a follow-up action for ps anchored in {motif}.'
],
        hints: [
        'Channel a friendly voice to express the intention.',
        'When feeling friendly, keep the pacing generous.',
        'Friendly energy pairs well with contrasting punctuation.',
        'Invite a friendly ally to review the result.',
        'Channel a professional voice to express the intention.',
        'When feeling professional, keep the pacing generous.',
        'Professional energy pairs well with contrasting punctuation.',
        'Invite a professional ally to review the result.',
        'Channel a playful voice to express the intention.',
        'When feeling playful, keep the pacing generous.',
        'Playful energy pairs well with contrasting punctuation.',
        'Invite a playful ally to review the result.',
        'Channel a bold voice to express the intention.',
        'When feeling bold, keep the pacing generous.',
        'Bold energy pairs well with contrasting punctuation.',
        'Invite a bold ally to review the result.',
        'Channel a calm voice to express the intention.',
        'When feeling calm, keep the pacing generous.',
        'Calm energy pairs well with contrasting punctuation.',
        'Invite a calm ally to review the result.'
],
        defaultConfig: {
    intensity: 'friendly',
    motif: 'persona',
    divider: '---',
    maxItems: 6,
    appendNotes: true
},
        form: [
        {
            key: 'intensity',
            label: 'Tone intensity',
            type: 'select',
            options: [
        {
            value: 'friendly',
            label: 'Friendly'
        },
        {
            value: 'professional',
            label: 'Professional'
        },
        {
            value: 'playful',
            label: 'Playful'
        },
        {
            value: 'bold',
            label: 'Bold'
        },
        {
            value: 'calm',
            label: 'Calm'
        }
]
        },
        {
            key: 'motif',
            label: 'Motif',
            type: 'select',
            options: [
        {
            value: 'persona',
            label: 'Persona'
        },
        {
            value: 'channel',
            label: 'Channel'
        },
        {
            value: 'invitation',
            label: 'Invitation'
        },
        {
            value: 'thanks',
            label: 'Thanks'
        },
        {
            value: 'follow-up',
            label: 'Follow-Up'
        }
]
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            min: 1,
            placeholder: '6'
        },
        {
            key: 'divider',
            label: 'Divider',
            type: 'text',
            placeholder: '---'
        },
        {
            key: 'appendNotes',
            label: 'Append creative notes',
            type: 'checkbox'
        }
]
    },
    {
        id: 'extended-action-prompt-seeder',
        category: 'action',
        name: 'Prompt seeder',
        description: 'Append imaginative prompt seeds to spark further exploration.',
        icon: 'sparkles',
        accent: '#c026d3',
        tags: [
        'action',
        'creativity',
        'prompt'
],
        mode: 'transform',
        operation: 'prompts',
        motifs: [
        'imagine',
        'contrast',
        'provocation',
        'scenario',
        'future'
],
        patterns: [
        'Prompt headline that references {motif}.',
        'Elaborate on prompt with a vivid detail about {motif}.',
        'Describe the tension surrounding prompt and {motif}.',
        'Outline a support move linked to prompt and {motif}.',
        'Suggest a celebratory note for prompt celebrating {motif}.',
        'Document a follow-up action for prompt anchored in {motif}.',
        'Why headline that references {motif}.',
        'Elaborate on why with a vivid detail about {motif}.',
        'Describe the tension surrounding why and {motif}.',
        'Outline a support move linked to why and {motif}.',
        'Suggest a celebratory note for why celebrating {motif}.',
        'Document a follow-up action for why anchored in {motif}.',
        'Stretch headline that references {motif}.',
        'Elaborate on stretch with a vivid detail about {motif}.',
        'Describe the tension surrounding stretch and {motif}.',
        'Outline a support move linked to stretch and {motif}.',
        'Suggest a celebratory note for stretch celebrating {motif}.',
        'Document a follow-up action for stretch anchored in {motif}.',
        'Constraint headline that references {motif}.',
        'Elaborate on constraint with a vivid detail about {motif}.',
        'Describe the tension surrounding constraint and {motif}.',
        'Outline a support move linked to constraint and {motif}.',
        'Suggest a celebratory note for constraint celebrating {motif}.',
        'Document a follow-up action for constraint anchored in {motif}.',
        'Unexpected headline that references {motif}.',
        'Elaborate on unexpected with a vivid detail about {motif}.',
        'Describe the tension surrounding unexpected and {motif}.',
        'Outline a support move linked to unexpected and {motif}.',
        'Suggest a celebratory note for unexpected celebrating {motif}.',
        'Document a follow-up action for unexpected anchored in {motif}.',
        'Action headline that references {motif}.',
        'Elaborate on action with a vivid detail about {motif}.',
        'Describe the tension surrounding action and {motif}.',
        'Outline a support move linked to action and {motif}.',
        'Suggest a celebratory note for action celebrating {motif}.',
        'Document a follow-up action for action anchored in {motif}.'
],
        hints: [
        'Channel a playful voice to express the intention.',
        'When feeling playful, keep the pacing generous.',
        'Playful energy pairs well with contrasting punctuation.',
        'Invite a playful ally to review the result.',
        'Channel a serious voice to express the intention.',
        'When feeling serious, keep the pacing generous.',
        'Serious energy pairs well with contrasting punctuation.',
        'Invite a serious ally to review the result.',
        'Channel a bold voice to express the intention.',
        'When feeling bold, keep the pacing generous.',
        'Bold energy pairs well with contrasting punctuation.',
        'Invite a bold ally to review the result.',
        'Channel a curious voice to express the intention.',
        'When feeling curious, keep the pacing generous.',
        'Curious energy pairs well with contrasting punctuation.',
        'Invite a curious ally to review the result.',
        'Channel a poetic voice to express the intention.',
        'When feeling poetic, keep the pacing generous.',
        'Poetic energy pairs well with contrasting punctuation.',
        'Invite a poetic ally to review the result.'
],
        defaultConfig: {
    intensity: 'playful',
    motif: 'imagine',
    divider: '---',
    maxItems: 6,
    appendNotes: true
},
        form: [
        {
            key: 'intensity',
            label: 'Tone intensity',
            type: 'select',
            options: [
        {
            value: 'playful',
            label: 'Playful'
        },
        {
            value: 'serious',
            label: 'Serious'
        },
        {
            value: 'bold',
            label: 'Bold'
        },
        {
            value: 'curious',
            label: 'Curious'
        },
        {
            value: 'poetic',
            label: 'Poetic'
        }
]
        },
        {
            key: 'motif',
            label: 'Motif',
            type: 'select',
            options: [
        {
            value: 'imagine',
            label: 'Imagine'
        },
        {
            value: 'contrast',
            label: 'Contrast'
        },
        {
            value: 'provocation',
            label: 'Provocation'
        },
        {
            value: 'scenario',
            label: 'Scenario'
        },
        {
            value: 'future',
            label: 'Future'
        }
]
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            min: 1,
            placeholder: '6'
        },
        {
            key: 'divider',
            label: 'Divider',
            type: 'text',
            placeholder: '---'
        },
        {
            key: 'appendNotes',
            label: 'Append creative notes',
            type: 'checkbox'
        }
]
    },
    {
        id: 'extended-action-ritual-maker',
        category: 'action',
        name: 'Ritual maker',
        description: 'Interleave the payload with micro-ritual suggestions and check-ins.',
        icon: 'repeat',
        accent: '#0ea5e9',
        tags: [
        'action',
        'habit',
        'ritual'
],
        mode: 'transform',
        operation: 'rituals',
        motifs: [
        'pause',
        'breathe',
        'stretch',
        'celebrate',
        'share'
],
        patterns: [
        'Moment headline that references {motif}.',
        'Elaborate on moment with a vivid detail about {motif}.',
        'Describe the tension surrounding moment and {motif}.',
        'Outline a support move linked to moment and {motif}.',
        'Suggest a celebratory note for moment celebrating {motif}.',
        'Document a follow-up action for moment anchored in {motif}.',
        'Cue headline that references {motif}.',
        'Elaborate on cue with a vivid detail about {motif}.',
        'Describe the tension surrounding cue and {motif}.',
        'Outline a support move linked to cue and {motif}.',
        'Suggest a celebratory note for cue celebrating {motif}.',
        'Document a follow-up action for cue anchored in {motif}.',
        'Action headline that references {motif}.',
        'Elaborate on action with a vivid detail about {motif}.',
        'Describe the tension surrounding action and {motif}.',
        'Outline a support move linked to action and {motif}.',
        'Suggest a celebratory note for action celebrating {motif}.',
        'Document a follow-up action for action anchored in {motif}.',
        'Reward headline that references {motif}.',
        'Elaborate on reward with a vivid detail about {motif}.',
        'Describe the tension surrounding reward and {motif}.',
        'Outline a support move linked to reward and {motif}.',
        'Suggest a celebratory note for reward celebrating {motif}.',
        'Document a follow-up action for reward anchored in {motif}.',
        'Reflection headline that references {motif}.',
        'Elaborate on reflection with a vivid detail about {motif}.',
        'Describe the tension surrounding reflection and {motif}.',
        'Outline a support move linked to reflection and {motif}.',
        'Suggest a celebratory note for reflection celebrating {motif}.',
        'Document a follow-up action for reflection anchored in {motif}.',
        'Share headline that references {motif}.',
        'Elaborate on share with a vivid detail about {motif}.',
        'Describe the tension surrounding share and {motif}.',
        'Outline a support move linked to share and {motif}.',
        'Suggest a celebratory note for share celebrating {motif}.',
        'Document a follow-up action for share anchored in {motif}.'
],
        hints: [
        'Channel a gentle voice to express the intention.',
        'When feeling gentle, keep the pacing generous.',
        'Gentle energy pairs well with contrasting punctuation.',
        'Invite a gentle ally to review the result.',
        'Channel a encouraging voice to express the intention.',
        'When feeling encouraging, keep the pacing generous.',
        'Encouraging energy pairs well with contrasting punctuation.',
        'Invite a encouraging ally to review the result.',
        'Channel a playful voice to express the intention.',
        'When feeling playful, keep the pacing generous.',
        'Playful energy pairs well with contrasting punctuation.',
        'Invite a playful ally to review the result.',
        'Channel a calm voice to express the intention.',
        'When feeling calm, keep the pacing generous.',
        'Calm energy pairs well with contrasting punctuation.',
        'Invite a calm ally to review the result.',
        'Channel a uplifting voice to express the intention.',
        'When feeling uplifting, keep the pacing generous.',
        'Uplifting energy pairs well with contrasting punctuation.',
        'Invite a uplifting ally to review the result.'
],
        defaultConfig: {
    intensity: 'gentle',
    motif: 'pause',
    divider: '---',
    maxItems: 6,
    appendNotes: true
},
        form: [
        {
            key: 'intensity',
            label: 'Tone intensity',
            type: 'select',
            options: [
        {
            value: 'gentle',
            label: 'Gentle'
        },
        {
            value: 'encouraging',
            label: 'Encouraging'
        },
        {
            value: 'playful',
            label: 'Playful'
        },
        {
            value: 'calm',
            label: 'Calm'
        },
        {
            value: 'uplifting',
            label: 'Uplifting'
        }
]
        },
        {
            key: 'motif',
            label: 'Motif',
            type: 'select',
            options: [
        {
            value: 'pause',
            label: 'Pause'
        },
        {
            value: 'breathe',
            label: 'Breathe'
        },
        {
            value: 'stretch',
            label: 'Stretch'
        },
        {
            value: 'celebrate',
            label: 'Celebrate'
        },
        {
            value: 'share',
            label: 'Share'
        }
]
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            min: 1,
            placeholder: '6'
        },
        {
            key: 'divider',
            label: 'Divider',
            type: 'text',
            placeholder: '---'
        },
        {
            key: 'appendNotes',
            label: 'Append creative notes',
            type: 'checkbox'
        }
]
    },
    {
        id: 'extended-action-context-weaver',
        category: 'action',
        name: 'Context weaver',
        description: 'Blend metadata such as audience, channel, and outcome around the payload.',
        icon: 'info',
        accent: '#4ade80',
        tags: [
        'action',
        'context',
        'metadata'
],
        mode: 'transform',
        operation: 'metadata',
        motifs: [
        'audience',
        'channel',
        'outcome',
        'timeline',
        'mood'
],
        patterns: [
        'Audience headline that references {motif}.',
        'Elaborate on audience with a vivid detail about {motif}.',
        'Describe the tension surrounding audience and {motif}.',
        'Outline a support move linked to audience and {motif}.',
        'Suggest a celebratory note for audience celebrating {motif}.',
        'Document a follow-up action for audience anchored in {motif}.',
        'Channel headline that references {motif}.',
        'Elaborate on channel with a vivid detail about {motif}.',
        'Describe the tension surrounding channel and {motif}.',
        'Outline a support move linked to channel and {motif}.',
        'Suggest a celebratory note for channel celebrating {motif}.',
        'Document a follow-up action for channel anchored in {motif}.',
        'Desired outcome headline that references {motif}.',
        'Elaborate on desired outcome with a vivid detail about {motif}.',
        'Describe the tension surrounding desired outcome and {motif}.',
        'Outline a support move linked to desired outcome and {motif}.',
        'Suggest a celebratory note for desired outcome celebrating {motif}.',
        'Document a follow-up action for desired outcome anchored in {motif}.',
        'Timing headline that references {motif}.',
        'Elaborate on timing with a vivid detail about {motif}.',
        'Describe the tension surrounding timing and {motif}.',
        'Outline a support move linked to timing and {motif}.',
        'Suggest a celebratory note for timing celebrating {motif}.',
        'Document a follow-up action for timing anchored in {motif}.',
        'Mood headline that references {motif}.',
        'Elaborate on mood with a vivid detail about {motif}.',
        'Describe the tension surrounding mood and {motif}.',
        'Outline a support move linked to mood and {motif}.',
        'Suggest a celebratory note for mood celebrating {motif}.',
        'Document a follow-up action for mood anchored in {motif}.',
        'Notes headline that references {motif}.',
        'Elaborate on notes with a vivid detail about {motif}.',
        'Describe the tension surrounding notes and {motif}.',
        'Outline a support move linked to notes and {motif}.',
        'Suggest a celebratory note for notes celebrating {motif}.',
        'Document a follow-up action for notes anchored in {motif}.'
],
        hints: [
        'Channel a factual voice to express the intention.',
        'When feeling factual, keep the pacing generous.',
        'Factual energy pairs well with contrasting punctuation.',
        'Invite a factual ally to review the result.',
        'Channel a warm voice to express the intention.',
        'When feeling warm, keep the pacing generous.',
        'Warm energy pairs well with contrasting punctuation.',
        'Invite a warm ally to review the result.',
        'Channel a energetic voice to express the intention.',
        'When feeling energetic, keep the pacing generous.',
        'Energetic energy pairs well with contrasting punctuation.',
        'Invite a energetic ally to review the result.',
        'Channel a calm voice to express the intention.',
        'When feeling calm, keep the pacing generous.',
        'Calm energy pairs well with contrasting punctuation.',
        'Invite a calm ally to review the result.',
        'Channel a structured voice to express the intention.',
        'When feeling structured, keep the pacing generous.',
        'Structured energy pairs well with contrasting punctuation.',
        'Invite a structured ally to review the result.'
],
        defaultConfig: {
    intensity: 'factual',
    motif: 'audience',
    divider: '---',
    maxItems: 6,
    appendNotes: true
},
        form: [
        {
            key: 'intensity',
            label: 'Tone intensity',
            type: 'select',
            options: [
        {
            value: 'factual',
            label: 'Factual'
        },
        {
            value: 'warm',
            label: 'Warm'
        },
        {
            value: 'energetic',
            label: 'Energetic'
        },
        {
            value: 'calm',
            label: 'Calm'
        },
        {
            value: 'structured',
            label: 'Structured'
        }
]
        },
        {
            key: 'motif',
            label: 'Motif',
            type: 'select',
            options: [
        {
            value: 'audience',
            label: 'Audience'
        },
        {
            value: 'channel',
            label: 'Channel'
        },
        {
            value: 'outcome',
            label: 'Outcome'
        },
        {
            value: 'timeline',
            label: 'Timeline'
        },
        {
            value: 'mood',
            label: 'Mood'
        }
]
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            min: 1,
            placeholder: '6'
        },
        {
            key: 'divider',
            label: 'Divider',
            type: 'text',
            placeholder: '---'
        },
        {
            key: 'appendNotes',
            label: 'Append creative notes',
            type: 'checkbox'
        }
]
    },
    {
        id: 'extended-action-note-collage',
        category: 'action',
        name: 'Note collage',
        description: 'Blend the payload with collage-style snippets like quotes, stats, and metaphors.',
        icon: 'layers',
        accent: '#34d399',
        tags: [
        'action',
        'creative',
        'collage'
],
        mode: 'transform',
        operation: 'collage',
        motifs: [
        'quote',
        'stat',
        'metaphor',
        'reminder',
        'vision'
],
        patterns: [
        'Snippet headline that references {motif}.',
        'Elaborate on snippet with a vivid detail about {motif}.',
        'Describe the tension surrounding snippet and {motif}.',
        'Outline a support move linked to snippet and {motif}.',
        'Suggest a celebratory note for snippet celebrating {motif}.',
        'Document a follow-up action for snippet anchored in {motif}.',
        'Source headline that references {motif}.',
        'Elaborate on source with a vivid detail about {motif}.',
        'Describe the tension surrounding source and {motif}.',
        'Outline a support move linked to source and {motif}.',
        'Suggest a celebratory note for source celebrating {motif}.',
        'Document a follow-up action for source anchored in {motif}.',
        'Emotion headline that references {motif}.',
        'Elaborate on emotion with a vivid detail about {motif}.',
        'Describe the tension surrounding emotion and {motif}.',
        'Outline a support move linked to emotion and {motif}.',
        'Suggest a celebratory note for emotion celebrating {motif}.',
        'Document a follow-up action for emotion anchored in {motif}.',
        'Action headline that references {motif}.',
        'Elaborate on action with a vivid detail about {motif}.',
        'Describe the tension surrounding action and {motif}.',
        'Outline a support move linked to action and {motif}.',
        'Suggest a celebratory note for action celebrating {motif}.',
        'Document a follow-up action for action anchored in {motif}.',
        'Anchor headline that references {motif}.',
        'Elaborate on anchor with a vivid detail about {motif}.',
        'Describe the tension surrounding anchor and {motif}.',
        'Outline a support move linked to anchor and {motif}.',
        'Suggest a celebratory note for anchor celebrating {motif}.',
        'Document a follow-up action for anchor anchored in {motif}.',
        'Spark headline that references {motif}.',
        'Elaborate on spark with a vivid detail about {motif}.',
        'Describe the tension surrounding spark and {motif}.',
        'Outline a support move linked to spark and {motif}.',
        'Suggest a celebratory note for spark celebrating {motif}.',
        'Document a follow-up action for spark anchored in {motif}.'
],
        hints: [
        'Channel a whimsical voice to express the intention.',
        'When feeling whimsical, keep the pacing generous.',
        'Whimsical energy pairs well with contrasting punctuation.',
        'Invite a whimsical ally to review the result.',
        'Channel a thoughtful voice to express the intention.',
        'When feeling thoughtful, keep the pacing generous.',
        'Thoughtful energy pairs well with contrasting punctuation.',
        'Invite a thoughtful ally to review the result.',
        'Channel a bold voice to express the intention.',
        'When feeling bold, keep the pacing generous.',
        'Bold energy pairs well with contrasting punctuation.',
        'Invite a bold ally to review the result.',
        'Channel a curious voice to express the intention.',
        'When feeling curious, keep the pacing generous.',
        'Curious energy pairs well with contrasting punctuation.',
        'Invite a curious ally to review the result.',
        'Channel a calm voice to express the intention.',
        'When feeling calm, keep the pacing generous.',
        'Calm energy pairs well with contrasting punctuation.',
        'Invite a calm ally to review the result.'
],
        defaultConfig: {
    intensity: 'whimsical',
    motif: 'quote',
    divider: '---',
    maxItems: 6,
    appendNotes: true
},
        form: [
        {
            key: 'intensity',
            label: 'Tone intensity',
            type: 'select',
            options: [
        {
            value: 'whimsical',
            label: 'Whimsical'
        },
        {
            value: 'thoughtful',
            label: 'Thoughtful'
        },
        {
            value: 'bold',
            label: 'Bold'
        },
        {
            value: 'curious',
            label: 'Curious'
        },
        {
            value: 'calm',
            label: 'Calm'
        }
]
        },
        {
            key: 'motif',
            label: 'Motif',
            type: 'select',
            options: [
        {
            value: 'quote',
            label: 'Quote'
        },
        {
            value: 'stat',
            label: 'Stat'
        },
        {
            value: 'metaphor',
            label: 'Metaphor'
        },
        {
            value: 'reminder',
            label: 'Reminder'
        },
        {
            value: 'vision',
            label: 'Vision'
        }
]
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            min: 1,
            placeholder: '6'
        },
        {
            key: 'divider',
            label: 'Divider',
            type: 'text',
            placeholder: '---'
        },
        {
            key: 'appendNotes',
            label: 'Append creative notes',
            type: 'checkbox'
        }
]
    },
    {
        id: 'extended-action-checkpoint-story',
        category: 'action',
        name: 'Checkpoint storyteller',
        description: 'Pair each payload line with a narrative status including obstacles and boosts.',
        icon: 'flag',
        accent: '#fb7185',
        tags: [
        'action',
        'status',
        'story'
],
        mode: 'transform',
        operation: 'story-status',
        motifs: [
        'obstacle',
        'boost',
        'signal',
        'ally',
        'lesson'
],
        patterns: [
        'Item headline that references {motif}.',
        'Elaborate on item with a vivid detail about {motif}.',
        'Describe the tension surrounding item and {motif}.',
        'Outline a support move linked to item and {motif}.',
        'Suggest a celebratory note for item celebrating {motif}.',
        'Document a follow-up action for item anchored in {motif}.',
        'Status headline that references {motif}.',
        'Elaborate on status with a vivid detail about {motif}.',
        'Describe the tension surrounding status and {motif}.',
        'Outline a support move linked to status and {motif}.',
        'Suggest a celebratory note for status celebrating {motif}.',
        'Document a follow-up action for status anchored in {motif}.',
        'Obstacle headline that references {motif}.',
        'Elaborate on obstacle with a vivid detail about {motif}.',
        'Describe the tension surrounding obstacle and {motif}.',
        'Outline a support move linked to obstacle and {motif}.',
        'Suggest a celebratory note for obstacle celebrating {motif}.',
        'Document a follow-up action for obstacle anchored in {motif}.',
        'Boost headline that references {motif}.',
        'Elaborate on boost with a vivid detail about {motif}.',
        'Describe the tension surrounding boost and {motif}.',
        'Outline a support move linked to boost and {motif}.',
        'Suggest a celebratory note for boost celebrating {motif}.',
        'Document a follow-up action for boost anchored in {motif}.',
        'Lesson headline that references {motif}.',
        'Elaborate on lesson with a vivid detail about {motif}.',
        'Describe the tension surrounding lesson and {motif}.',
        'Outline a support move linked to lesson and {motif}.',
        'Suggest a celebratory note for lesson celebrating {motif}.',
        'Document a follow-up action for lesson anchored in {motif}.',
        'Next step headline that references {motif}.',
        'Elaborate on next step with a vivid detail about {motif}.',
        'Describe the tension surrounding next step and {motif}.',
        'Outline a support move linked to next step and {motif}.',
        'Suggest a celebratory note for next step celebrating {motif}.',
        'Document a follow-up action for next step anchored in {motif}.'
],
        hints: [
        'Channel a encouraging voice to express the intention.',
        'When feeling encouraging, keep the pacing generous.',
        'Encouraging energy pairs well with contrasting punctuation.',
        'Invite a encouraging ally to review the result.',
        'Channel a candid voice to express the intention.',
        'When feeling candid, keep the pacing generous.',
        'Candid energy pairs well with contrasting punctuation.',
        'Invite a candid ally to review the result.',
        'Channel a balanced voice to express the intention.',
        'When feeling balanced, keep the pacing generous.',
        'Balanced energy pairs well with contrasting punctuation.',
        'Invite a balanced ally to review the result.',
        'Channel a pragmatic voice to express the intention.',
        'When feeling pragmatic, keep the pacing generous.',
        'Pragmatic energy pairs well with contrasting punctuation.',
        'Invite a pragmatic ally to review the result.',
        'Channel a hopeful voice to express the intention.',
        'When feeling hopeful, keep the pacing generous.',
        'Hopeful energy pairs well with contrasting punctuation.',
        'Invite a hopeful ally to review the result.'
],
        defaultConfig: {
    intensity: 'encouraging',
    motif: 'obstacle',
    divider: '---',
    maxItems: 6,
    appendNotes: true
},
        form: [
        {
            key: 'intensity',
            label: 'Tone intensity',
            type: 'select',
            options: [
        {
            value: 'encouraging',
            label: 'Encouraging'
        },
        {
            value: 'candid',
            label: 'Candid'
        },
        {
            value: 'balanced',
            label: 'Balanced'
        },
        {
            value: 'pragmatic',
            label: 'Pragmatic'
        },
        {
            value: 'hopeful',
            label: 'Hopeful'
        }
]
        },
        {
            key: 'motif',
            label: 'Motif',
            type: 'select',
            options: [
        {
            value: 'obstacle',
            label: 'Obstacle'
        },
        {
            value: 'boost',
            label: 'Boost'
        },
        {
            value: 'signal',
            label: 'Signal'
        },
        {
            value: 'ally',
            label: 'Ally'
        },
        {
            value: 'lesson',
            label: 'Lesson'
        }
]
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            min: 1,
            placeholder: '6'
        },
        {
            key: 'divider',
            label: 'Divider',
            type: 'text',
            placeholder: '---'
        },
        {
            key: 'appendNotes',
            label: 'Append creative notes',
            type: 'checkbox'
        }
]
    },
    {
        id: 'extended-action-pattern-scout',
        category: 'action',
        name: 'Pattern scout',
        description: 'Annotate the payload with detected patterns, tensions, and opportunities.',
        icon: 'zap',
        accent: '#f97316',
        tags: [
        'action',
        'analysis',
        'pattern'
],
        mode: 'transform',
        operation: 'patterns',
        motifs: [
        'pattern',
        'tension',
        'opportunity',
        'signal',
        'habit'
],
        patterns: [
        'Pattern headline that references {motif}.',
        'Elaborate on pattern with a vivid detail about {motif}.',
        'Describe the tension surrounding pattern and {motif}.',
        'Outline a support move linked to pattern and {motif}.',
        'Suggest a celebratory note for pattern celebrating {motif}.',
        'Document a follow-up action for pattern anchored in {motif}.',
        'Signal headline that references {motif}.',
        'Elaborate on signal with a vivid detail about {motif}.',
        'Describe the tension surrounding signal and {motif}.',
        'Outline a support move linked to signal and {motif}.',
        'Suggest a celebratory note for signal celebrating {motif}.',
        'Document a follow-up action for signal anchored in {motif}.',
        'Why it matters headline that references {motif}.',
        'Elaborate on why it matters with a vivid detail about {motif}.',
        'Describe the tension surrounding why it matters and {motif}.',
        'Outline a support move linked to why it matters and {motif}.',
        'Suggest a celebratory note for why it matters celebrating {motif}.',
        'Document a follow-up action for why it matters anchored in {motif}.',
        'Opportunity headline that references {motif}.',
        'Elaborate on opportunity with a vivid detail about {motif}.',
        'Describe the tension surrounding opportunity and {motif}.',
        'Outline a support move linked to opportunity and {motif}.',
        'Suggest a celebratory note for opportunity celebrating {motif}.',
        'Document a follow-up action for opportunity anchored in {motif}.',
        'Risk headline that references {motif}.',
        'Elaborate on risk with a vivid detail about {motif}.',
        'Describe the tension surrounding risk and {motif}.',
        'Outline a support move linked to risk and {motif}.',
        'Suggest a celebratory note for risk celebrating {motif}.',
        'Document a follow-up action for risk anchored in {motif}.',
        'First step headline that references {motif}.',
        'Elaborate on first step with a vivid detail about {motif}.',
        'Describe the tension surrounding first step and {motif}.',
        'Outline a support move linked to first step and {motif}.',
        'Suggest a celebratory note for first step celebrating {motif}.',
        'Document a follow-up action for first step anchored in {motif}.'
],
        hints: [
        'Channel a observant voice to express the intention.',
        'When feeling observant, keep the pacing generous.',
        'Observant energy pairs well with contrasting punctuation.',
        'Invite a observant ally to review the result.',
        'Channel a analytical voice to express the intention.',
        'When feeling analytical, keep the pacing generous.',
        'Analytical energy pairs well with contrasting punctuation.',
        'Invite a analytical ally to review the result.',
        'Channel a excited voice to express the intention.',
        'When feeling excited, keep the pacing generous.',
        'Excited energy pairs well with contrasting punctuation.',
        'Invite a excited ally to review the result.',
        'Channel a curious voice to express the intention.',
        'When feeling curious, keep the pacing generous.',
        'Curious energy pairs well with contrasting punctuation.',
        'Invite a curious ally to review the result.',
        'Channel a pragmatic voice to express the intention.',
        'When feeling pragmatic, keep the pacing generous.',
        'Pragmatic energy pairs well with contrasting punctuation.',
        'Invite a pragmatic ally to review the result.'
],
        defaultConfig: {
    intensity: 'observant',
    motif: 'pattern',
    divider: '---',
    maxItems: 6,
    appendNotes: true
},
        form: [
        {
            key: 'intensity',
            label: 'Tone intensity',
            type: 'select',
            options: [
        {
            value: 'observant',
            label: 'Observant'
        },
        {
            value: 'analytical',
            label: 'Analytical'
        },
        {
            value: 'excited',
            label: 'Excited'
        },
        {
            value: 'curious',
            label: 'Curious'
        },
        {
            value: 'pragmatic',
            label: 'Pragmatic'
        }
]
        },
        {
            key: 'motif',
            label: 'Motif',
            type: 'select',
            options: [
        {
            value: 'pattern',
            label: 'Pattern'
        },
        {
            value: 'tension',
            label: 'Tension'
        },
        {
            value: 'opportunity',
            label: 'Opportunity'
        },
        {
            value: 'signal',
            label: 'Signal'
        },
        {
            value: 'habit',
            label: 'Habit'
        }
]
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            min: 1,
            placeholder: '6'
        },
        {
            key: 'divider',
            label: 'Divider',
            type: 'text',
            placeholder: '---'
        },
        {
            key: 'appendNotes',
            label: 'Append creative notes',
            type: 'checkbox'
        }
]
    },
    {
        id: 'extended-utility-sentence-splitter',
        category: 'utility',
        name: 'Sentence splitter',
        description: 'Split payload into sentences and store them with metadata about length and energy.',
        icon: 'scissors',
        accent: '#38bdf8',
        tags: [
        'utility',
        'text',
        'analysis'
],
        mode: 'utility',
        operation: 'split-sentences',
        metrics: [
        'length',
        'wordCount',
        'energy',
        'question',
        'exclamation'
],
        thresholds: [
        12,
        24,
        36,
        48,
        60
],
        guidance: [
        'Track length for transparency.',
        'When length spikes, capture a note in logs.',
        'Share length with allies when alignment is needed.',
        'Record a before/after snapshot highlighting length shifts.',
        'Build a follow-up ritual referencing length insights.',
        'Track wordCount for transparency.',
        'When wordCount spikes, capture a note in logs.',
        'Share wordCount with allies when alignment is needed.',
        'Record a before/after snapshot highlighting wordCount shifts.',
        'Build a follow-up ritual referencing wordCount insights.',
        'Track energy for transparency.',
        'When energy spikes, capture a note in logs.',
        'Share energy with allies when alignment is needed.',
        'Record a before/after snapshot highlighting energy shifts.',
        'Build a follow-up ritual referencing energy insights.',
        'Track question for transparency.',
        'When question spikes, capture a note in logs.',
        'Share question with allies when alignment is needed.',
        'Record a before/after snapshot highlighting question shifts.',
        'Build a follow-up ritual referencing question insights.',
        'Track exclamation for transparency.',
        'When exclamation spikes, capture a note in logs.',
        'Share exclamation with allies when alignment is needed.',
        'Record a before/after snapshot highlighting exclamation shifts.',
        'Build a follow-up ritual referencing exclamation insights.'
],
        defaultConfig: {
    storeKey: 'sentence_splitter',
    sensitivity: 36,
    maxItems: 10,
    includePayload: true,
    notes: ''
},
        form: [
        {
            key: 'storeKey',
            label: 'Store under key',
            type: 'text',
            placeholder: 'sentence_splitter'
        },
        {
            key: 'sensitivity',
            label: 'Sensitivity',
            type: 'number',
            placeholder: '36'
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            placeholder: '10'
        },
        {
            key: 'includePayload',
            label: 'Include payload snapshot',
            type: 'checkbox'
        },
        {
            key: 'notes',
            label: 'Notes',
            type: 'textarea',
            rows: 2,
            placeholder: 'Context for this metric'
        }
]
    },
    {
        id: 'extended-utility-character-limit',
        category: 'utility',
        name: 'Character limiter',
        description: 'Clamp payload length, report diff, and store trimmed content in vars.',
        icon: 'crop',
        accent: '#f97316',
        tags: [
        'utility',
        'text',
        'limit'
],
        mode: 'utility',
        operation: 'limit-characters',
        metrics: [
        'limit',
        'original',
        'trimmed',
        'delta',
        'withinRange'
],
        thresholds: [
        80,
        120,
        180,
        240,
        320
],
        guidance: [
        'Track limit for transparency.',
        'When limit spikes, capture a note in logs.',
        'Share limit with allies when alignment is needed.',
        'Record a before/after snapshot highlighting limit shifts.',
        'Build a follow-up ritual referencing limit insights.',
        'Track original for transparency.',
        'When original spikes, capture a note in logs.',
        'Share original with allies when alignment is needed.',
        'Record a before/after snapshot highlighting original shifts.',
        'Build a follow-up ritual referencing original insights.',
        'Track trimmed for transparency.',
        'When trimmed spikes, capture a note in logs.',
        'Share trimmed with allies when alignment is needed.',
        'Record a before/after snapshot highlighting trimmed shifts.',
        'Build a follow-up ritual referencing trimmed insights.',
        'Track delta for transparency.',
        'When delta spikes, capture a note in logs.',
        'Share delta with allies when alignment is needed.',
        'Record a before/after snapshot highlighting delta shifts.',
        'Build a follow-up ritual referencing delta insights.',
        'Track withinRange for transparency.',
        'When withinRange spikes, capture a note in logs.',
        'Share withinRange with allies when alignment is needed.',
        'Record a before/after snapshot highlighting withinRange shifts.',
        'Build a follow-up ritual referencing withinRange insights.'
],
        defaultConfig: {
    storeKey: 'character_limit',
    sensitivity: 180,
    maxItems: 10,
    includePayload: true,
    notes: ''
},
        form: [
        {
            key: 'storeKey',
            label: 'Store under key',
            type: 'text',
            placeholder: 'character_limit'
        },
        {
            key: 'sensitivity',
            label: 'Sensitivity',
            type: 'number',
            placeholder: '180'
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            placeholder: '10'
        },
        {
            key: 'includePayload',
            label: 'Include payload snapshot',
            type: 'checkbox'
        },
        {
            key: 'notes',
            label: 'Notes',
            type: 'textarea',
            rows: 2,
            placeholder: 'Context for this metric'
        }
]
    },
    {
        id: 'extended-utility-phrase-extractor',
        category: 'utility',
        name: 'Phrase extractor',
        description: 'Extract repeating phrases, store them, and annotate the payload with markers.',
        icon: 'filter',
        accent: '#a855f7',
        tags: [
        'utility',
        'text',
        'keyword'
],
        mode: 'utility',
        operation: 'extract-phrases',
        metrics: [
        'phrase',
        'frequency',
        'sample',
        'weight',
        'confidence'
],
        thresholds: [
        2,
        3,
        4,
        5,
        6
],
        guidance: [
        'Track phrase for transparency.',
        'When phrase spikes, capture a note in logs.',
        'Share phrase with allies when alignment is needed.',
        'Record a before/after snapshot highlighting phrase shifts.',
        'Build a follow-up ritual referencing phrase insights.',
        'Track frequency for transparency.',
        'When frequency spikes, capture a note in logs.',
        'Share frequency with allies when alignment is needed.',
        'Record a before/after snapshot highlighting frequency shifts.',
        'Build a follow-up ritual referencing frequency insights.',
        'Track sample for transparency.',
        'When sample spikes, capture a note in logs.',
        'Share sample with allies when alignment is needed.',
        'Record a before/after snapshot highlighting sample shifts.',
        'Build a follow-up ritual referencing sample insights.',
        'Track weight for transparency.',
        'When weight spikes, capture a note in logs.',
        'Share weight with allies when alignment is needed.',
        'Record a before/after snapshot highlighting weight shifts.',
        'Build a follow-up ritual referencing weight insights.',
        'Track confidence for transparency.',
        'When confidence spikes, capture a note in logs.',
        'Share confidence with allies when alignment is needed.',
        'Record a before/after snapshot highlighting confidence shifts.',
        'Build a follow-up ritual referencing confidence insights.'
],
        defaultConfig: {
    storeKey: 'phrase_extractor',
    sensitivity: 4,
    maxItems: 10,
    includePayload: true,
    notes: ''
},
        form: [
        {
            key: 'storeKey',
            label: 'Store under key',
            type: 'text',
            placeholder: 'phrase_extractor'
        },
        {
            key: 'sensitivity',
            label: 'Sensitivity',
            type: 'number',
            placeholder: '4'
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            placeholder: '10'
        },
        {
            key: 'includePayload',
            label: 'Include payload snapshot',
            type: 'checkbox'
        },
        {
            key: 'notes',
            label: 'Notes',
            type: 'textarea',
            rows: 2,
            placeholder: 'Context for this metric'
        }
]
    },
    {
        id: 'extended-utility-column-balancer',
        category: 'utility',
        name: 'Column balancer',
        description: 'Split payload lines into two balanced columns stored inside vars.',
        icon: 'columns',
        accent: '#22c55e',
        tags: [
        'utility',
        'format',
        'layout'
],
        mode: 'utility',
        operation: 'balance-columns',
        metrics: [
        'left',
        'right',
        'difference',
        'longest',
        'shortest'
],
        thresholds: [
        5,
        10,
        15,
        20,
        25
],
        guidance: [
        'Track left for transparency.',
        'When left spikes, capture a note in logs.',
        'Share left with allies when alignment is needed.',
        'Record a before/after snapshot highlighting left shifts.',
        'Build a follow-up ritual referencing left insights.',
        'Track right for transparency.',
        'When right spikes, capture a note in logs.',
        'Share right with allies when alignment is needed.',
        'Record a before/after snapshot highlighting right shifts.',
        'Build a follow-up ritual referencing right insights.',
        'Track difference for transparency.',
        'When difference spikes, capture a note in logs.',
        'Share difference with allies when alignment is needed.',
        'Record a before/after snapshot highlighting difference shifts.',
        'Build a follow-up ritual referencing difference insights.',
        'Track longest for transparency.',
        'When longest spikes, capture a note in logs.',
        'Share longest with allies when alignment is needed.',
        'Record a before/after snapshot highlighting longest shifts.',
        'Build a follow-up ritual referencing longest insights.',
        'Track shortest for transparency.',
        'When shortest spikes, capture a note in logs.',
        'Share shortest with allies when alignment is needed.',
        'Record a before/after snapshot highlighting shortest shifts.',
        'Build a follow-up ritual referencing shortest insights.'
],
        defaultConfig: {
    storeKey: 'column_balancer',
    sensitivity: 15,
    maxItems: 10,
    includePayload: true,
    notes: ''
},
        form: [
        {
            key: 'storeKey',
            label: 'Store under key',
            type: 'text',
            placeholder: 'column_balancer'
        },
        {
            key: 'sensitivity',
            label: 'Sensitivity',
            type: 'number',
            placeholder: '15'
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            placeholder: '10'
        },
        {
            key: 'includePayload',
            label: 'Include payload snapshot',
            type: 'checkbox'
        },
        {
            key: 'notes',
            label: 'Notes',
            type: 'textarea',
            rows: 2,
            placeholder: 'Context for this metric'
        }
]
    },
    {
        id: 'extended-utility-chunk-maker',
        category: 'utility',
        name: 'Chunk maker',
        description: 'Chunk the payload into sections with overlap for storytelling continuity.',
        icon: 'layers',
        accent: '#facc15',
        tags: [
        'utility',
        'text',
        'chunk'
],
        mode: 'utility',
        operation: 'chunk-text',
        metrics: [
        'chunk',
        'start',
        'end',
        'overlap',
        'sequence'
],
        thresholds: [
        80,
        120,
        160,
        200,
        240
],
        guidance: [
        'Track chunk for transparency.',
        'When chunk spikes, capture a note in logs.',
        'Share chunk with allies when alignment is needed.',
        'Record a before/after snapshot highlighting chunk shifts.',
        'Build a follow-up ritual referencing chunk insights.',
        'Track start for transparency.',
        'When start spikes, capture a note in logs.',
        'Share start with allies when alignment is needed.',
        'Record a before/after snapshot highlighting start shifts.',
        'Build a follow-up ritual referencing start insights.',
        'Track end for transparency.',
        'When end spikes, capture a note in logs.',
        'Share end with allies when alignment is needed.',
        'Record a before/after snapshot highlighting end shifts.',
        'Build a follow-up ritual referencing end insights.',
        'Track overlap for transparency.',
        'When overlap spikes, capture a note in logs.',
        'Share overlap with allies when alignment is needed.',
        'Record a before/after snapshot highlighting overlap shifts.',
        'Build a follow-up ritual referencing overlap insights.',
        'Track sequence for transparency.',
        'When sequence spikes, capture a note in logs.',
        'Share sequence with allies when alignment is needed.',
        'Record a before/after snapshot highlighting sequence shifts.',
        'Build a follow-up ritual referencing sequence insights.'
],
        defaultConfig: {
    storeKey: 'chunk_maker',
    sensitivity: 160,
    maxItems: 10,
    includePayload: true,
    notes: ''
},
        form: [
        {
            key: 'storeKey',
            label: 'Store under key',
            type: 'text',
            placeholder: 'chunk_maker'
        },
        {
            key: 'sensitivity',
            label: 'Sensitivity',
            type: 'number',
            placeholder: '160'
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            placeholder: '10'
        },
        {
            key: 'includePayload',
            label: 'Include payload snapshot',
            type: 'checkbox'
        },
        {
            key: 'notes',
            label: 'Notes',
            type: 'textarea',
            rows: 2,
            placeholder: 'Context for this metric'
        }
]
    },
    {
        id: 'extended-utility-progress-ledger',
        category: 'utility',
        name: 'Progress ledger',
        description: 'Track progress metrics inside vars and annotate payload with progress bars.',
        icon: 'bar-chart-2',
        accent: '#22d3ee',
        tags: [
        'utility',
        'progress',
        'metrics'
],
        mode: 'utility',
        operation: 'progress-metrics',
        metrics: [
        'total',
        'completed',
        'percent',
        'remaining',
        'status'
],
        thresholds: [
        25,
        50,
        75,
        90,
        100
],
        guidance: [
        'Track total for transparency.',
        'When total spikes, capture a note in logs.',
        'Share total with allies when alignment is needed.',
        'Record a before/after snapshot highlighting total shifts.',
        'Build a follow-up ritual referencing total insights.',
        'Track completed for transparency.',
        'When completed spikes, capture a note in logs.',
        'Share completed with allies when alignment is needed.',
        'Record a before/after snapshot highlighting completed shifts.',
        'Build a follow-up ritual referencing completed insights.',
        'Track percent for transparency.',
        'When percent spikes, capture a note in logs.',
        'Share percent with allies when alignment is needed.',
        'Record a before/after snapshot highlighting percent shifts.',
        'Build a follow-up ritual referencing percent insights.',
        'Track remaining for transparency.',
        'When remaining spikes, capture a note in logs.',
        'Share remaining with allies when alignment is needed.',
        'Record a before/after snapshot highlighting remaining shifts.',
        'Build a follow-up ritual referencing remaining insights.',
        'Track status for transparency.',
        'When status spikes, capture a note in logs.',
        'Share status with allies when alignment is needed.',
        'Record a before/after snapshot highlighting status shifts.',
        'Build a follow-up ritual referencing status insights.'
],
        defaultConfig: {
    storeKey: 'progress_ledger',
    sensitivity: 75,
    maxItems: 10,
    includePayload: true,
    notes: ''
},
        form: [
        {
            key: 'storeKey',
            label: 'Store under key',
            type: 'text',
            placeholder: 'progress_ledger'
        },
        {
            key: 'sensitivity',
            label: 'Sensitivity',
            type: 'number',
            placeholder: '75'
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            placeholder: '10'
        },
        {
            key: 'includePayload',
            label: 'Include payload snapshot',
            type: 'checkbox'
        },
        {
            key: 'notes',
            label: 'Notes',
            type: 'textarea',
            rows: 2,
            placeholder: 'Context for this metric'
        }
]
    },
    {
        id: 'extended-utility-branch-keyword',
        category: 'utility',
        name: 'Keyword branch',
        description: 'Branch workflow based on keyword presence, storing flags in vars.',
        icon: 'git-branch',
        accent: '#4ade80',
        tags: [
        'utility',
        'logic',
        'branch'
],
        mode: 'utility',
        operation: 'branch-keyword',
        metrics: [
        'keyword',
        'present',
        'count',
        'firstIndex',
        'lastIndex'
],
        thresholds: [
        1,
        2,
        3,
        4,
        5
],
        guidance: [
        'Track keyword for transparency.',
        'When keyword spikes, capture a note in logs.',
        'Share keyword with allies when alignment is needed.',
        'Record a before/after snapshot highlighting keyword shifts.',
        'Build a follow-up ritual referencing keyword insights.',
        'Track present for transparency.',
        'When present spikes, capture a note in logs.',
        'Share present with allies when alignment is needed.',
        'Record a before/after snapshot highlighting present shifts.',
        'Build a follow-up ritual referencing present insights.',
        'Track count for transparency.',
        'When count spikes, capture a note in logs.',
        'Share count with allies when alignment is needed.',
        'Record a before/after snapshot highlighting count shifts.',
        'Build a follow-up ritual referencing count insights.',
        'Track firstIndex for transparency.',
        'When firstIndex spikes, capture a note in logs.',
        'Share firstIndex with allies when alignment is needed.',
        'Record a before/after snapshot highlighting firstIndex shifts.',
        'Build a follow-up ritual referencing firstIndex insights.',
        'Track lastIndex for transparency.',
        'When lastIndex spikes, capture a note in logs.',
        'Share lastIndex with allies when alignment is needed.',
        'Record a before/after snapshot highlighting lastIndex shifts.',
        'Build a follow-up ritual referencing lastIndex insights.'
],
        defaultConfig: {
    storeKey: 'branch_keyword',
    sensitivity: 3,
    maxItems: 10,
    includePayload: true,
    notes: ''
},
        form: [
        {
            key: 'storeKey',
            label: 'Store under key',
            type: 'text',
            placeholder: 'branch_keyword'
        },
        {
            key: 'sensitivity',
            label: 'Sensitivity',
            type: 'number',
            placeholder: '3'
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            placeholder: '10'
        },
        {
            key: 'includePayload',
            label: 'Include payload snapshot',
            type: 'checkbox'
        },
        {
            key: 'notes',
            label: 'Notes',
            type: 'textarea',
            rows: 2,
            placeholder: 'Context for this metric'
        }
]
    },
    {
        id: 'extended-utility-tone-detector',
        category: 'utility',
        name: 'Tone detector',
        description: 'Estimate tone by counting emotive words and punctuation cues.',
        icon: 'smile',
        accent: '#f43f5e',
        tags: [
        'utility',
        'tone',
        'analysis'
],
        mode: 'utility',
        operation: 'tone-detector',
        metrics: [
        'warmth',
        'urgency',
        'confidence',
        'surprise',
        'neutral'
],
        thresholds: [
        3,
        6,
        9,
        12,
        15
],
        guidance: [
        'Track warmth for transparency.',
        'When warmth spikes, capture a note in logs.',
        'Share warmth with allies when alignment is needed.',
        'Record a before/after snapshot highlighting warmth shifts.',
        'Build a follow-up ritual referencing warmth insights.',
        'Track urgency for transparency.',
        'When urgency spikes, capture a note in logs.',
        'Share urgency with allies when alignment is needed.',
        'Record a before/after snapshot highlighting urgency shifts.',
        'Build a follow-up ritual referencing urgency insights.',
        'Track confidence for transparency.',
        'When confidence spikes, capture a note in logs.',
        'Share confidence with allies when alignment is needed.',
        'Record a before/after snapshot highlighting confidence shifts.',
        'Build a follow-up ritual referencing confidence insights.',
        'Track surprise for transparency.',
        'When surprise spikes, capture a note in logs.',
        'Share surprise with allies when alignment is needed.',
        'Record a before/after snapshot highlighting surprise shifts.',
        'Build a follow-up ritual referencing surprise insights.',
        'Track neutral for transparency.',
        'When neutral spikes, capture a note in logs.',
        'Share neutral with allies when alignment is needed.',
        'Record a before/after snapshot highlighting neutral shifts.',
        'Build a follow-up ritual referencing neutral insights.'
],
        defaultConfig: {
    storeKey: 'tone_detector',
    sensitivity: 9,
    maxItems: 10,
    includePayload: true,
    notes: ''
},
        form: [
        {
            key: 'storeKey',
            label: 'Store under key',
            type: 'text',
            placeholder: 'tone_detector'
        },
        {
            key: 'sensitivity',
            label: 'Sensitivity',
            type: 'number',
            placeholder: '9'
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            placeholder: '10'
        },
        {
            key: 'includePayload',
            label: 'Include payload snapshot',
            type: 'checkbox'
        },
        {
            key: 'notes',
            label: 'Notes',
            type: 'textarea',
            rows: 2,
            placeholder: 'Context for this metric'
        }
]
    },
    {
        id: 'extended-utility-field-stamper',
        category: 'utility',
        name: 'Field stamper',
        description: 'Stamp metadata fields into vars while keeping a tidy log output.',
        icon: 'tag',
        accent: '#c026d3',
        tags: [
        'utility',
        'metadata',
        'vars'
],
        mode: 'utility',
        operation: 'stamp-fields',
        metrics: [
        'field',
        'value',
        'source',
        'confidence',
        'timestamp'
],
        thresholds: [
        10,
        20,
        30,
        40,
        50
],
        guidance: [
        'Track field for transparency.',
        'When field spikes, capture a note in logs.',
        'Share field with allies when alignment is needed.',
        'Record a before/after snapshot highlighting field shifts.',
        'Build a follow-up ritual referencing field insights.',
        'Track value for transparency.',
        'When value spikes, capture a note in logs.',
        'Share value with allies when alignment is needed.',
        'Record a before/after snapshot highlighting value shifts.',
        'Build a follow-up ritual referencing value insights.',
        'Track source for transparency.',
        'When source spikes, capture a note in logs.',
        'Share source with allies when alignment is needed.',
        'Record a before/after snapshot highlighting source shifts.',
        'Build a follow-up ritual referencing source insights.',
        'Track confidence for transparency.',
        'When confidence spikes, capture a note in logs.',
        'Share confidence with allies when alignment is needed.',
        'Record a before/after snapshot highlighting confidence shifts.',
        'Build a follow-up ritual referencing confidence insights.',
        'Track timestamp for transparency.',
        'When timestamp spikes, capture a note in logs.',
        'Share timestamp with allies when alignment is needed.',
        'Record a before/after snapshot highlighting timestamp shifts.',
        'Build a follow-up ritual referencing timestamp insights.'
],
        defaultConfig: {
    storeKey: 'field_stamper',
    sensitivity: 30,
    maxItems: 10,
    includePayload: true,
    notes: ''
},
        form: [
        {
            key: 'storeKey',
            label: 'Store under key',
            type: 'text',
            placeholder: 'field_stamper'
        },
        {
            key: 'sensitivity',
            label: 'Sensitivity',
            type: 'number',
            placeholder: '30'
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            placeholder: '10'
        },
        {
            key: 'includePayload',
            label: 'Include payload snapshot',
            type: 'checkbox'
        },
        {
            key: 'notes',
            label: 'Notes',
            type: 'textarea',
            rows: 2,
            placeholder: 'Context for this metric'
        }
]
    },
    {
        id: 'extended-utility-payload-snapshot',
        category: 'utility',
        name: 'Payload snapshot',
        description: 'Store a snapshot of the payload under multiple versions for later reuse.',
        icon: 'camera',
        accent: '#64748b',
        tags: [
        'utility',
        'storage',
        'history'
],
        mode: 'utility',
        operation: 'snapshot',
        metrics: [
        'slot',
        'length',
        'hash',
        'created',
        'label'
],
        thresholds: [
        4,
        8,
        12,
        16,
        20
],
        guidance: [
        'Track slot for transparency.',
        'When slot spikes, capture a note in logs.',
        'Share slot with allies when alignment is needed.',
        'Record a before/after snapshot highlighting slot shifts.',
        'Build a follow-up ritual referencing slot insights.',
        'Track length for transparency.',
        'When length spikes, capture a note in logs.',
        'Share length with allies when alignment is needed.',
        'Record a before/after snapshot highlighting length shifts.',
        'Build a follow-up ritual referencing length insights.',
        'Track hash for transparency.',
        'When hash spikes, capture a note in logs.',
        'Share hash with allies when alignment is needed.',
        'Record a before/after snapshot highlighting hash shifts.',
        'Build a follow-up ritual referencing hash insights.',
        'Track created for transparency.',
        'When created spikes, capture a note in logs.',
        'Share created with allies when alignment is needed.',
        'Record a before/after snapshot highlighting created shifts.',
        'Build a follow-up ritual referencing created insights.',
        'Track label for transparency.',
        'When label spikes, capture a note in logs.',
        'Share label with allies when alignment is needed.',
        'Record a before/after snapshot highlighting label shifts.',
        'Build a follow-up ritual referencing label insights.'
],
        defaultConfig: {
    storeKey: 'payload_snapshot',
    sensitivity: 12,
    maxItems: 10,
    includePayload: true,
    notes: ''
},
        form: [
        {
            key: 'storeKey',
            label: 'Store under key',
            type: 'text',
            placeholder: 'payload_snapshot'
        },
        {
            key: 'sensitivity',
            label: 'Sensitivity',
            type: 'number',
            placeholder: '12'
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            placeholder: '10'
        },
        {
            key: 'includePayload',
            label: 'Include payload snapshot',
            type: 'checkbox'
        },
        {
            key: 'notes',
            label: 'Notes',
            type: 'textarea',
            rows: 2,
            placeholder: 'Context for this metric'
        }
]
    },
    {
        id: 'extended-utility-outline-index',
        category: 'utility',
        name: 'Outline index',
        description: 'Generate an index of headings and bullet counts from the payload.',
        icon: 'list-ordered',
        accent: '#8b5cf6',
        tags: [
        'utility',
        'structure',
        'index'
],
        mode: 'utility',
        operation: 'outline-index',
        metrics: [
        'heading',
        'level',
        'line',
        'count',
        'marker'
],
        thresholds: [
        1,
        2,
        3,
        4,
        5
],
        guidance: [
        'Track heading for transparency.',
        'When heading spikes, capture a note in logs.',
        'Share heading with allies when alignment is needed.',
        'Record a before/after snapshot highlighting heading shifts.',
        'Build a follow-up ritual referencing heading insights.',
        'Track level for transparency.',
        'When level spikes, capture a note in logs.',
        'Share level with allies when alignment is needed.',
        'Record a before/after snapshot highlighting level shifts.',
        'Build a follow-up ritual referencing level insights.',
        'Track line for transparency.',
        'When line spikes, capture a note in logs.',
        'Share line with allies when alignment is needed.',
        'Record a before/after snapshot highlighting line shifts.',
        'Build a follow-up ritual referencing line insights.',
        'Track count for transparency.',
        'When count spikes, capture a note in logs.',
        'Share count with allies when alignment is needed.',
        'Record a before/after snapshot highlighting count shifts.',
        'Build a follow-up ritual referencing count insights.',
        'Track marker for transparency.',
        'When marker spikes, capture a note in logs.',
        'Share marker with allies when alignment is needed.',
        'Record a before/after snapshot highlighting marker shifts.',
        'Build a follow-up ritual referencing marker insights.'
],
        defaultConfig: {
    storeKey: 'outline_index',
    sensitivity: 3,
    maxItems: 10,
    includePayload: true,
    notes: ''
},
        form: [
        {
            key: 'storeKey',
            label: 'Store under key',
            type: 'text',
            placeholder: 'outline_index'
        },
        {
            key: 'sensitivity',
            label: 'Sensitivity',
            type: 'number',
            placeholder: '3'
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            placeholder: '10'
        },
        {
            key: 'includePayload',
            label: 'Include payload snapshot',
            type: 'checkbox'
        },
        {
            key: 'notes',
            label: 'Notes',
            type: 'textarea',
            rows: 2,
            placeholder: 'Context for this metric'
        }
]
    },
    {
        id: 'extended-utility-momentum-scan',
        category: 'utility',
        name: 'Momentum scan',
        description: 'Assess momentum by evaluating verbs, progress words, and energy cues.',
        icon: 'trending-up',
        accent: '#f97316',
        tags: [
        'utility',
        'analysis',
        'momentum'
],
        mode: 'utility',
        operation: 'momentum-scan',
        metrics: [
        'actionWords',
        'pauseWords',
        'progressSignals',
        'energyScore',
        'momentumLevel'
],
        thresholds: [
        5,
        10,
        15,
        20,
        25
],
        guidance: [
        'Track actionWords for transparency.',
        'When actionWords spikes, capture a note in logs.',
        'Share actionWords with allies when alignment is needed.',
        'Record a before/after snapshot highlighting actionWords shifts.',
        'Build a follow-up ritual referencing actionWords insights.',
        'Track pauseWords for transparency.',
        'When pauseWords spikes, capture a note in logs.',
        'Share pauseWords with allies when alignment is needed.',
        'Record a before/after snapshot highlighting pauseWords shifts.',
        'Build a follow-up ritual referencing pauseWords insights.',
        'Track progressSignals for transparency.',
        'When progressSignals spikes, capture a note in logs.',
        'Share progressSignals with allies when alignment is needed.',
        'Record a before/after snapshot highlighting progressSignals shifts.',
        'Build a follow-up ritual referencing progressSignals insights.',
        'Track energyScore for transparency.',
        'When energyScore spikes, capture a note in logs.',
        'Share energyScore with allies when alignment is needed.',
        'Record a before/after snapshot highlighting energyScore shifts.',
        'Build a follow-up ritual referencing energyScore insights.',
        'Track momentumLevel for transparency.',
        'When momentumLevel spikes, capture a note in logs.',
        'Share momentumLevel with allies when alignment is needed.',
        'Record a before/after snapshot highlighting momentumLevel shifts.',
        'Build a follow-up ritual referencing momentumLevel insights.'
],
        defaultConfig: {
    storeKey: 'momentum_scan',
    sensitivity: 15,
    maxItems: 10,
    includePayload: true,
    notes: ''
},
        form: [
        {
            key: 'storeKey',
            label: 'Store under key',
            type: 'text',
            placeholder: 'momentum_scan'
        },
        {
            key: 'sensitivity',
            label: 'Sensitivity',
            type: 'number',
            placeholder: '15'
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            placeholder: '10'
        },
        {
            key: 'includePayload',
            label: 'Include payload snapshot',
            type: 'checkbox'
        },
        {
            key: 'notes',
            label: 'Notes',
            type: 'textarea',
            rows: 2,
            placeholder: 'Context for this metric'
        }
]
    },
    {
        id: 'extended-utility-recap-bundler',
        category: 'utility',
        name: 'Recap bundler',
        description: 'Bundle payload paragraphs into recap bullets with call-to-action hints.',
        icon: 'briefcase',
        accent: '#22c55e',
        tags: [
        'utility',
        'recap',
        'summary'
],
        mode: 'utility',
        operation: 'recap-bullets',
        metrics: [
        'paragraph',
        'length',
        'callToAction',
        'emotion',
        'priority'
],
        thresholds: [
        3,
        6,
        9,
        12,
        15
],
        guidance: [
        'Track paragraph for transparency.',
        'When paragraph spikes, capture a note in logs.',
        'Share paragraph with allies when alignment is needed.',
        'Record a before/after snapshot highlighting paragraph shifts.',
        'Build a follow-up ritual referencing paragraph insights.',
        'Track length for transparency.',
        'When length spikes, capture a note in logs.',
        'Share length with allies when alignment is needed.',
        'Record a before/after snapshot highlighting length shifts.',
        'Build a follow-up ritual referencing length insights.',
        'Track callToAction for transparency.',
        'When callToAction spikes, capture a note in logs.',
        'Share callToAction with allies when alignment is needed.',
        'Record a before/after snapshot highlighting callToAction shifts.',
        'Build a follow-up ritual referencing callToAction insights.',
        'Track emotion for transparency.',
        'When emotion spikes, capture a note in logs.',
        'Share emotion with allies when alignment is needed.',
        'Record a before/after snapshot highlighting emotion shifts.',
        'Build a follow-up ritual referencing emotion insights.',
        'Track priority for transparency.',
        'When priority spikes, capture a note in logs.',
        'Share priority with allies when alignment is needed.',
        'Record a before/after snapshot highlighting priority shifts.',
        'Build a follow-up ritual referencing priority insights.'
],
        defaultConfig: {
    storeKey: 'recap_bundler',
    sensitivity: 9,
    maxItems: 10,
    includePayload: true,
    notes: ''
},
        form: [
        {
            key: 'storeKey',
            label: 'Store under key',
            type: 'text',
            placeholder: 'recap_bundler'
        },
        {
            key: 'sensitivity',
            label: 'Sensitivity',
            type: 'number',
            placeholder: '9'
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            placeholder: '10'
        },
        {
            key: 'includePayload',
            label: 'Include payload snapshot',
            type: 'checkbox'
        },
        {
            key: 'notes',
            label: 'Notes',
            type: 'textarea',
            rows: 2,
            placeholder: 'Context for this metric'
        }
]
    },
    {
        id: 'extended-utility-risk-scorer',
        category: 'utility',
        name: 'Risk scorer',
        description: 'Score risk levels based on keywords, length, and sentiment cues.',
        icon: 'shield',
        accent: '#ef4444',
        tags: [
        'utility',
        'risk',
        'analysis'
],
        mode: 'utility',
        operation: 'risk-score',
        metrics: [
        'risk',
        'evidence',
        'severity',
        'owner',
        'nextAction'
],
        thresholds: [
        1,
        3,
        5,
        7,
        9
],
        guidance: [
        'Track risk for transparency.',
        'When risk spikes, capture a note in logs.',
        'Share risk with allies when alignment is needed.',
        'Record a before/after snapshot highlighting risk shifts.',
        'Build a follow-up ritual referencing risk insights.',
        'Track evidence for transparency.',
        'When evidence spikes, capture a note in logs.',
        'Share evidence with allies when alignment is needed.',
        'Record a before/after snapshot highlighting evidence shifts.',
        'Build a follow-up ritual referencing evidence insights.',
        'Track severity for transparency.',
        'When severity spikes, capture a note in logs.',
        'Share severity with allies when alignment is needed.',
        'Record a before/after snapshot highlighting severity shifts.',
        'Build a follow-up ritual referencing severity insights.',
        'Track owner for transparency.',
        'When owner spikes, capture a note in logs.',
        'Share owner with allies when alignment is needed.',
        'Record a before/after snapshot highlighting owner shifts.',
        'Build a follow-up ritual referencing owner insights.',
        'Track nextAction for transparency.',
        'When nextAction spikes, capture a note in logs.',
        'Share nextAction with allies when alignment is needed.',
        'Record a before/after snapshot highlighting nextAction shifts.',
        'Build a follow-up ritual referencing nextAction insights.'
],
        defaultConfig: {
    storeKey: 'risk_scorer',
    sensitivity: 5,
    maxItems: 10,
    includePayload: true,
    notes: ''
},
        form: [
        {
            key: 'storeKey',
            label: 'Store under key',
            type: 'text',
            placeholder: 'risk_scorer'
        },
        {
            key: 'sensitivity',
            label: 'Sensitivity',
            type: 'number',
            placeholder: '5'
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            placeholder: '10'
        },
        {
            key: 'includePayload',
            label: 'Include payload snapshot',
            type: 'checkbox'
        },
        {
            key: 'notes',
            label: 'Notes',
            type: 'textarea',
            rows: 2,
            placeholder: 'Context for this metric'
        }
]
    },
    {
        id: 'extended-utility-gratitude-meter',
        category: 'utility',
        name: 'Gratitude meter',
        description: 'Measure gratitude cues and append a reflective gratitude summary.',
        icon: 'heart',
        accent: '#f472b6',
        tags: [
        'utility',
        'gratitude',
        'reflection'
],
        mode: 'utility',
        operation: 'gratitude-meter',
        metrics: [
        'thanks',
        'support',
        'joy',
        'surprise',
        'kindness'
],
        thresholds: [
        2,
        4,
        6,
        8,
        10
],
        guidance: [
        'Track thanks for transparency.',
        'When thanks spikes, capture a note in logs.',
        'Share thanks with allies when alignment is needed.',
        'Record a before/after snapshot highlighting thanks shifts.',
        'Build a follow-up ritual referencing thanks insights.',
        'Track support for transparency.',
        'When support spikes, capture a note in logs.',
        'Share support with allies when alignment is needed.',
        'Record a before/after snapshot highlighting support shifts.',
        'Build a follow-up ritual referencing support insights.',
        'Track joy for transparency.',
        'When joy spikes, capture a note in logs.',
        'Share joy with allies when alignment is needed.',
        'Record a before/after snapshot highlighting joy shifts.',
        'Build a follow-up ritual referencing joy insights.',
        'Track surprise for transparency.',
        'When surprise spikes, capture a note in logs.',
        'Share surprise with allies when alignment is needed.',
        'Record a before/after snapshot highlighting surprise shifts.',
        'Build a follow-up ritual referencing surprise insights.',
        'Track kindness for transparency.',
        'When kindness spikes, capture a note in logs.',
        'Share kindness with allies when alignment is needed.',
        'Record a before/after snapshot highlighting kindness shifts.',
        'Build a follow-up ritual referencing kindness insights.'
],
        defaultConfig: {
    storeKey: 'gratitude_meter',
    sensitivity: 6,
    maxItems: 10,
    includePayload: true,
    notes: ''
},
        form: [
        {
            key: 'storeKey',
            label: 'Store under key',
            type: 'text',
            placeholder: 'gratitude_meter'
        },
        {
            key: 'sensitivity',
            label: 'Sensitivity',
            type: 'number',
            placeholder: '6'
        },
        {
            key: 'maxItems',
            label: 'Maximum items',
            type: 'number',
            placeholder: '10'
        },
        {
            key: 'includePayload',
            label: 'Include payload snapshot',
            type: 'checkbox'
        },
        {
            key: 'notes',
            label: 'Notes',
            type: 'textarea',
            rows: 2,
            placeholder: 'Context for this metric'
        }
]
    }
];

function normaliseList(value, separator = ',') {
    if (Array.isArray(value)) {
        return value
            .map(item => String(item || '').trim())
            .filter(Boolean);
    }
    if (typeof value === 'string') {
        return value.split(separator).map(part => part.trim()).filter(Boolean);
    }
    return [];
}

function selectTone(spec, tone) {
    const available = Array.isArray(spec.tones) ? spec.tones : [];
    if (available.includes(tone)) return tone;
    return available[0] || tone || 'balanced';
}

function createDivider(divider = '---', length = 3) {
    const text = String(divider || '---');
    if (text.length * length > 120) {
        return text;
    }
    return Array.from({ length: Math.max(1, length) }, () => text).join(' ');
}

function toLines(value) {
    if (Array.isArray(value)) return value.map(item => String(item ?? ''));
    return String(value ?? '').split(/\r?\n/);
}

function formatTableRow(cells, pad = 0) {
    const processed = cells.map(cell => String(cell ?? '').trim());
    const padded = processed.map(cell => cell.padEnd(cell.length + pad, ' '));
    return `| ${padded.join(' | ')} |`;
}

function repeatArray(source, targetLength) {
    const result = [];
    if (!Array.isArray(source) || source.length === 0) return result;
    for (let i = 0; i < targetLength; i += 1) {
        result.push(source[i % source.length]);
    }
    return result;
}

function ensureNumber(value, fallback = 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
    return fallback;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function countOccurrences(text, term) {
    if (!term) return 0;
    const pattern = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = String(text || '').match(pattern);
    return matches ? matches.length : 0;
}

function splitSentences(text) {
    const content = String(text || '');
    const raw = content.split(/(?<=[.!?])\s+/);
    return raw.map(sentence => sentence.trim()).filter(Boolean);
}

function buildTemplateOutput(spec, config, QuickActionTools) {
    const title = String(config?.title || spec.defaultConfig.title || spec.name);
    const tone = selectTone(spec, config?.tone);
    const requestedSections = normaliseList(config?.sections);
    const includeReflection = Boolean(config?.includeReflection);
    const highlights = normaliseList(config?.customHighlights, '\n');
    const sections = [];
    sections.push(`# ${title}`);
    sections.push(`Tone: ${tone}`);
    sections.push(createDivider('—', 12));
    const useAll = requestedSections.length === 0;
    spec.sections.forEach(section => {
        if (!useAll && !requestedSections.some(name => name.toLowerCase() === section.title.toLowerCase())) {
            return;
        }
        sections.push(`## ${section.title}`);
        sections.push('');
        section.prompts.forEach(prompt => {
            sections.push(`- ${prompt}`);
        });
        sections.push('');
        section.ideas.forEach((idea, ideaIndex) => {
            const label = ['Idea', 'Play', 'Spark', 'Experiment'][ideaIndex % 4];
            sections.push(`  - ${label}: ${idea}`);
        });
        sections.push('');
        section.checkpoints.forEach(checkpoint => {
            sections.push(`  - [ ] ${checkpoint}`);
        });
        sections.push(createDivider('~', 8));
    });
    if (highlights.length > 0) {
        sections.push('## Custom highlights');
        highlights.forEach(item => {
            sections.push(`- ${item}`);
        });
        sections.push(createDivider('.', 16));
    }
    if (includeReflection) {
        sections.push('## Reflection prompts');
        const toneIndex = Math.max(0, spec.affirmations.length - 12);
        spec.affirmations.slice(toneIndex).forEach(line => {
            sections.push(`- ${line}`);
        });
    }
    sections.push('');
    sections.push('## Affirmations to broadcast');
    spec.affirmations.slice(0, 12).forEach(line => {
        sections.push(`- ${line}`);
    });
    const payload = sections.join('
');
    return {
        payload,
        summary: `${title} with ${useAll ? 'all sections' : requestedSections.length + ' sections'}`,
        tone,
        sectionCount: sections.filter(line => line.startsWith('## ')).length
    };
}

function buildTransformOutput(spec, config, QuickActionContext, QuickActionTools, context) {
    const clone = QuickActionContext.clone(context);
    const tone = selectTone({ tones: spec.patterns }, config?.intensity);
    const motifKey = String(config?.motif || spec.defaultConfig.motif || spec.motifs?.[0] || 'idea');
    const motifLabel = motifKey.replace(/-/g, ' ');
    const divider = createDivider(config?.divider || spec.defaultConfig.divider || '---', 3);
    const maxItems = Math.max(1, ensureNumber(config?.maxItems, spec.defaultConfig.maxItems || 6));
    const notes = [];
    const sourceLines = toLines(clone.payload);
    const patterns = spec.patterns || [];
    const descriptions = repeatArray(patterns, maxItems);
    const outputs = [];
    switch (spec.operation) {
        case 'prepend': {
            outputs.push(`# ${toTitleCase(motifLabel)}`);
            outputs.push(`Tone cue: ${tone}`);
            outputs.push(divider);
            descriptions.forEach((line, index) => {
                outputs.push(`- ${line.replace('{motif}', motifLabel)}`);
            });
            outputs.push(divider);
            outputs.push(...sourceLines);
            break;
        }
        case 'append': {
            outputs.push(...sourceLines);
            outputs.push(divider);
            outputs.push(`# Closing cadence`);
            descriptions.forEach(line => {
                outputs.push(`- ${line.replace('{motif}', motifLabel)}`);
            });
            break;
        }
        case 'wrap': {
            outputs.push(divider);
            outputs.push(`> ${motifLabel.toUpperCase()} CALL OUT`);
            descriptions.forEach(line => {
                outputs.push(`> ${line.replace('{motif}', motifLabel)}`);
            });
            outputs.push(divider);
            sourceLines.forEach(line => outputs.push(`> ${line}`));
            outputs.push(divider);
            break;
        }
        case 'bullets': {
            outputs.push(`# ${motifLabel} breakdown`);
            descriptions.forEach((line, index) => {
                outputs.push(`- ${line.replace('{motif}', motifLabel)}:`);
                const detail = sourceLines[index] || sourceLines[sourceLines.length - 1] || '';
                outputs.push(`  - ${detail}`);
            });
            break;
        }
        case 'table': {
            const headers = ['Index', ...spec.structures || ['Column A', 'Column B', 'Column C']];
            outputs.push(formatTableRow(headers));
            outputs.push(formatTableRow(headers.map(() => '---')));
            descriptions.forEach((line, index) => {
                const raw = sourceLines[index] || '';
                const cells = [String(index + 1), raw, line.replace('{motif}', motifLabel), tone, motifLabel];
                outputs.push(formatTableRow(cells));
            });
            break;
        }
        case 'divider': {
            sourceLines.forEach((line, index) => {
                outputs.push(line);
                const motif = descriptions[index] || descriptions[0] || motifLabel;
                outputs.push(`${divider} ${motif.replace('{motif}', motifLabel)}`);
            });
            break;
        }
        case 'highlight': {
            const keyword = motifLabel.split(' ')[0];
            sourceLines.forEach(line => {
                if (!line.trim()) {
                    outputs.push(line);
                    return;
                }
                const emphasised = line.replace(new RegExp(keyword, 'gi'), match => `**${match.toUpperCase()}**`);
                outputs.push(emphasised);
            });
            outputs.push(divider);
            descriptions.slice(0, 4).forEach(line => outputs.push(`- ${line.replace('{motif}', motifLabel)}`));
            break;
        }
        case 'questions': {
            outputs.push(...sourceLines);
            outputs.push(divider);
            outputs.push('# Questions to explore');
            descriptions.slice(0, maxItems).forEach(line => outputs.push(`- ${line.replace('{motif}', motifLabel)}`));
            break;
        }
        case 'storybeats': {
            outputs.push('# Story beats');
            descriptions.slice(0, maxItems).forEach((line, index) => {
                const source = sourceLines[index] || '';
                outputs.push(`- Beat ${index + 1}: ${line.replace('{motif}', motifLabel)}`);
                outputs.push(`  - Scene: ${source}`);
            });
            break;
        }
        case 'contrast': {
            outputs.push('# Contrast lens');
            descriptions.slice(0, maxItems).forEach((line, index) => {
                const raw = sourceLines[index] || '';
                outputs.push(`- ${line.replace('{motif}', motifLabel)}`);
                outputs.push(`  - Snapshot: ${raw}`);
            });
            break;
        }
        case 'insights': {
            outputs.push('# Insight notebook');
            descriptions.slice(0, maxItems).forEach((line, index) => {
                const raw = sourceLines[index] || '';
                outputs.push(`- Observation: ${raw}`);
                outputs.push(`  - Reflection: ${line.replace('{motif}', motifLabel)}`);
            });
            break;
        }
        case 'checkpoint': {
            outputs.push('# Checkpoint grid');
            descriptions.slice(0, maxItems).forEach((line, index) => {
                const raw = sourceLines[index] || '';
                outputs.push(`- [ ] ${line.replace('{motif}', motifLabel)} :: ${raw}`);
            });
            break;
        }
        case 'summary': {
            outputs.push('# Summary highlights');
            descriptions.slice(0, maxItems).forEach((line, index) => {
                outputs.push(`- ${line.replace('{motif}', motifLabel)}: ${sourceLines[index] || ''}`);
            });
            break;
        }
        case 'timeline': {
            outputs.push('| Time | Description | Mood | Confidence |');
            outputs.push('| --- | --- | --- | --- |');
            descriptions.slice(0, maxItems).forEach((line, index) => {
                const raw = sourceLines[index] || '';
                outputs.push(`| ${index + 1} | ${raw} | ${tone} | ${line.replace('{motif}', motifLabel)} |`);
            });
            break;
        }
        case 'signature': {
            outputs.push(...sourceLines);
            outputs.push(divider);
            outputs.push(`# Signature`);
            outputs.push(`Persona: ${motifLabel}`);
            outputs.push(`Tone: ${tone}`);
            outputs.push(`Invitation: ${descriptions[0].replace('{motif}', motifLabel)}`);
            break;
        }
        case 'prompts': {
            outputs.push(...sourceLines);
            outputs.push(divider);
            outputs.push(`# Prompt seeds`);
            descriptions.slice(0, maxItems).forEach(line => outputs.push(`- ${line.replace('{motif}', motifLabel)}`));
            break;
        }
        case 'rituals': {
            outputs.push('# Rituals to try');
            descriptions.slice(0, maxItems).forEach((line, index) => {
                const raw = sourceLines[index] || '';
                outputs.push(`- ${line.replace('{motif}', motifLabel)} :: ${raw}`);
            });
            break;
        }
        case 'metadata': {
            outputs.push(`# Context weave`);
            descriptions.slice(0, maxItems).forEach((line, index) => {
                const raw = sourceLines[index] || '';
                outputs.push(`- ${line.replace('{motif}', motifLabel)}: ${raw}`);
            });
            break;
        }
        case 'collage': {
            outputs.push('# Collage snippets');
            descriptions.slice(0, maxItems).forEach((line, index) => {
                const raw = sourceLines[index] || '';
                outputs.push(`- ${line.replace('{motif}', motifLabel)} => ${raw}`);
            });
            break;
        }
        case 'story-status': {
            outputs.push('# Status storyteller');
            descriptions.slice(0, maxItems).forEach((line, index) => {
                const raw = sourceLines[index] || '';
                outputs.push(`- Item: ${raw}`);
                outputs.push(`  - Narrative: ${line.replace('{motif}', motifLabel)}`);
            });
            break;
        }
        case 'patterns': {
            outputs.push('# Pattern scout');
            descriptions.slice(0, maxItems).forEach((line, index) => {
                const raw = sourceLines[index] || '';
                outputs.push(`- Pattern: ${line.replace('{motif}', motifLabel)}`);
                outputs.push(`  - Evidence: ${raw}`);
            });
            break;
        }
        default: {
            outputs.push(...sourceLines);
        }
    }
    if (config?.appendNotes) {
        outputs.push(divider);
        outputs.push('# Creative notes');
        spec.hints.slice(0, 6).forEach(hint => outputs.push(`- ${hint}`));
    }
    clone.payload = outputs.join('
');
    clone.logs.push(`Applied ${spec.name} with motif ${motifLabel}.`);
    return clone;
}

function buildUtilityOutput(spec, config, QuickActionContext, QuickActionTools, context) {
    const clone = QuickActionContext.clone(context);
    const storeKey = String(config?.storeKey || spec.defaultConfig.storeKey || spec.id);
    const sensitivity = ensureNumber(config?.sensitivity, spec.defaultConfig.sensitivity || 0);
    const maxItems = Math.max(1, ensureNumber(config?.maxItems, spec.defaultConfig.maxItems || 10));
    const includePayload = Boolean(config?.includePayload ?? spec.defaultConfig.includePayload);
    const notes = String(config?.notes || spec.defaultConfig.notes || '');
    const metrics = [];
    const payloadText = QuickActionTools?.toText ? QuickActionTools.toText(clone.payload) : String(clone.payload ?? '');
    switch (spec.operation) {
        case 'split-sentences': {
            const sentences = splitSentences(payloadText);
            sentences.slice(0, maxItems).forEach((sentence, index) => {
                const words = sentence.split(/\s+/).filter(Boolean);
                const energy = clamp(words.length / sensitivity, 0, 10);
                metrics.push({
                    index,
                    sentence,
                    length: sentence.length,
                    wordCount: words.length,
                    energy: Number(energy.toFixed(2)),
                    question: sentence.includes('?'),
                    exclamation: sentence.includes('!')
                });
            });
            clone.vars[storeKey] = metrics;
            clone.logs.push(`Split payload into ${metrics.length} sentences.`);
            break;
        }
        case 'limit-characters': {
            const limit = Math.max(1, sensitivity || 200);
            const original = payloadText.length;
            const trimmed = payloadText.slice(0, limit);
            clone.payload = trimmed;
            clone.vars[storeKey] = {
                limit,
                original,
                trimmed: trimmed.length,
                delta: original - trimmed.length,
                withinRange: original <= limit
            };
            clone.logs.push(`Trimmed payload to ${limit} characters.`);
            break;
        }
        case 'extract-phrases': {
            const words = payloadText.split(/\s+/).filter(Boolean);
            const counts = new Map();
            for (let i = 0; i < words.length - 1; i += 1) {
                const phrase = `${words[i]} ${words[i + 1]}`.toLowerCase();
                counts.set(phrase, (counts.get(phrase) || 0) + 1);
            }
            const sorted = Array.from(counts.entries())
                .map(([phrase, frequency]) => ({ phrase, frequency }))
                .filter(item => item.frequency >= 2)
                .sort((a, b) => b.frequency - a.frequency)
                .slice(0, maxItems);
            clone.vars[storeKey] = sorted;
            clone.logs.push(`Extracted ${sorted.length} frequent phrases.`);
            break;
        }
        case 'balance-columns': {
            const lines = toLines(payloadText).filter(Boolean);
            const midpoint = Math.ceil(lines.length / 2);
            const left = lines.slice(0, midpoint);
            const right = lines.slice(midpoint);
            clone.vars[storeKey] = { left, right, difference: Math.abs(left.length - right.length) };
            clone.logs.push(`Balanced ${lines.length} lines into two columns.`);
            break;
        }
        case 'chunk-text': {
            const chunkSize = Math.max(40, sensitivity);
            const overlap = Math.floor(chunkSize / 5);
            const chunks = [];
            for (let start = 0; start < payloadText.length; start += chunkSize) {
                const end = Math.min(payloadText.length, start + chunkSize);
                const chunk = payloadText.slice(Math.max(0, start - overlap), end);
                chunks.push({ start, end, overlap, content: chunk });
            }
            clone.vars[storeKey] = chunks.slice(0, maxItems);
            clone.logs.push(`Created ${chunks.length} chunks with overlap ${overlap}.`);
            break;
        }
        case 'progress-metrics': {
            const lines = toLines(payloadText).filter(Boolean);
            const total = lines.length || 1;
            const completed = lines.filter(line => /\b(done|complete|shipped)\b/i.test(line)).length;
            const percent = Math.round((completed / total) * 100);
            clone.vars[storeKey] = { total, completed, percent, remaining: total - completed, status: percent >= sensitivity ? 'on-track' : 'in-progress' };
            clone.logs.push(`Progress at ${percent}% (${completed}/${total}).`);
            break;
        }
        case 'branch-keyword': {
            const keywords = normaliseList(notes, ',');
            const results = keywords.map(keyword => {
                const count = countOccurrences(payloadText, keyword);
                return { keyword, present: count > 0, count };
            });
            clone.vars[storeKey] = results;
            clone.logs.push(`Keyword branch processed ${results.length} items.`);
            break;
        }
        case 'tone-detector': {
            const metricsMap = { warmth: ['thank', 'appreciate', 'delight'], urgency: ['now', 'asap', 'urgent'], confidence: ['sure', 'confident', 'clear'], surprise: ['wow', 'unexpected', 'surprised'], neutral: ['note', 'update', 'info'] };
            const scores = {};
            Object.entries(metricsMap).forEach(([key, terms]) => {
                scores[key] = terms.reduce((acc, term) => acc + countOccurrences(payloadText, term), 0);
            });
            clone.vars[storeKey] = scores;
            clone.logs.push('Calculated tone scores.');
            break;
        }
        case 'stamp-fields': {
            const lines = toLines(payloadText).filter(Boolean);
            const stamped = lines.slice(0, maxItems).map((line, index) => ({ field: `${storeKey}_${index + 1}`, value: line, source: 'payload', confidence: 1 }));
            clone.vars[storeKey] = stamped;
            clone.logs.push(`Stamped ${stamped.length} fields.`);
            break;
        }
        case 'snapshot': {
            const timestamp = new Date().toISOString();
            const snapshot = { slot: storeKey, length: payloadText.length, hash: payloadText.length.toString(16), created: timestamp, label: notes || 'snapshot' };
            if (!Array.isArray(clone.vars.snapshots)) clone.vars.snapshots = [];
            clone.vars.snapshots.push(snapshot);
            clone.logs.push('Stored payload snapshot.');
            break;
        }
        case 'outline-index': {
            const lines = toLines(payloadText);
            const outline = [];
            lines.forEach((line, index) => {
                const headingMatch = line.match(/^(#+)\s+(.*)$/);
                if (headingMatch) {
                    outline.push({ heading: headingMatch[2], level: headingMatch[1].length, line: index + 1 });
                }
            });
            clone.vars[storeKey] = outline.slice(0, maxItems);
            clone.logs.push(`Indexed ${outline.length} headings.`);
            break;
        }
        case 'momentum-scan': {
            const verbs = ['ship', 'launch', 'measure', 'plan', 'draft'];
            const pauses = ['wait', 'hold', 'blocked', 'pause'];
            const momentum = verbs.reduce((acc, term) => acc + countOccurrences(payloadText, term), 0);
            const stalls = pauses.reduce((acc, term) => acc + countOccurrences(payloadText, term), 0);
            clone.vars[storeKey] = { actionWords: momentum, pauseWords: stalls, progressSignals: momentum - stalls, energyScore: clamp(momentum - stalls + sensitivity, 0, 100), momentumLevel: momentum > stalls ? 'forward' : 'steady' };
            clone.logs.push('Calculated momentum metrics.');
            break;
        }
        case 'recap-bullets': {
            const paragraphs = payloadText.split(/\n\s*\n/).filter(Boolean);
            clone.vars[storeKey] = paragraphs.slice(0, maxItems).map((para, index) => ({ paragraph: index + 1, length: para.length, callToAction: para.includes('?'), emotion: para.includes('!'), priority: index + 1 }));
            clone.logs.push(`Bundled ${paragraphs.length} recap paragraphs.`);
            break;
        }
        case 'risk-score': {
            const riskTerms = ['risk', 'issue', 'concern', 'blocker'];
            const severity = riskTerms.reduce((acc, term) => acc + countOccurrences(payloadText, term), 0);
            clone.vars[storeKey] = { risk: severity, evidence: severity > sensitivity ? 'needs attention' : 'calm', severity, owner: notes || 'unassigned', nextAction: severity > sensitivity ? 'escalate' : 'monitor' };
            clone.logs.push(`Risk severity measured at ${severity}.`);
            break;
        }
        case 'gratitude-meter': {
            const gratitudeWords = ['thank', 'grateful', 'appreciate', 'celebrate'];
            const joyWords = ['joy', 'delight', 'smile'];
            const thanks = gratitudeWords.reduce((acc, term) => acc + countOccurrences(payloadText, term), 0);
            const joy = joyWords.reduce((acc, term) => acc + countOccurrences(payloadText, term), 0);
            clone.vars[storeKey] = { thanks, joy, support: countOccurrences(payloadText, 'support'), surprise: countOccurrences(payloadText, 'surprise'), kindness: countOccurrences(payloadText, 'kind') };
            clone.logs.push('Measured gratitude signals.');
            if (includePayload) {
                clone.payload = `${payloadText}

---
Gratitude summary: ${thanks} thanks, ${joy} joy cues.`;
            }
            break;
        }
        default: {
            clone.vars[storeKey] = { note: 'No utility operation executed.' };
        }
    }
    if (notes) {
        clone.logs.push(notes);
    }
    return clone;
}

function toTitleCase(text) {
    return String(text || '').split(/\s+/).map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');
}

function createModuleDefinition(spec, deps) {
    const { QuickActionContext = { clone: base => ({ payload: base?.payload ?? null, vars: { ...(base?.vars || {}) }, logs: Array.isArray(base?.logs) ? [...base.logs] : [] }) }, QuickActionTools = { toText: value => String(value ?? '') } } = deps || {};
    const inputs = spec.category === 'trigger' ? [] : [{ id: 'input', label: 'Input' }];
    const outputs = [{ id: 'next', label: 'Next' }];
    return {
        id: spec.id,
        category: spec.category,
        name: spec.name,
        description: spec.description,
        icon: spec.icon || 'zap',
        accent: spec.accent || '#38bdf8',
        tags: spec.tags || [],
        inputs,
        outputs,
        defaultConfig: spec.defaultConfig || {},
        form: spec.form || [],
        run: async (context, config) => {
            if (spec.mode === 'template') {
                const result = buildTemplateOutput(spec, config, QuickActionTools);
                const clone = QuickActionContext.clone(context);
                clone.payload = result.payload;
                clone.logs.push(`Generated ${spec.name} with tone ${result.tone}.`);
                clone.vars[spec.id] = { tone: result.tone, summary: result.summary, sectionCount: result.sectionCount };
                return [clone];
            }
            if (spec.mode === 'transform') {
                const clone = buildTransformOutput(spec, config, QuickActionContext, QuickActionTools, context);
                return [clone];
            }
            if (spec.mode === 'utility') {
                const clone = buildUtilityOutput(spec, config, QuickActionContext, QuickActionTools, context);
                return [clone];
            }
            const clone = QuickActionContext.clone(context);
            clone.logs.push('No operation performed.');
            return [clone];
        }
    };
}

module.exports = (deps = {}) => {
    return ExtendedBlockSpecs.map(spec => createModuleDefinition(spec, deps));
};
