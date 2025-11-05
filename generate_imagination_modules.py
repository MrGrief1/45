from textwrap import indent
from pathlib import Path

OUTPUT = 'quick-action-imagination-modules.js'


def js_string(value: str) -> str:
    return "'" + value.replace('\\', '\\\\').replace("'", "\\'") + "'"


def js_value(value, level=0):
    if isinstance(value, str):
        return js_string(value)
    if isinstance(value, bool):
        return 'true' if value else 'false'
    if value is None:
        return 'null'
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, list):
        if not value:
            return '[]'
        lines = ['[']
        for item in value:
            lines.append('    ' * (level + 1) + js_value(item, level + 1) + ',')
        lines.append('    ' * level + ']')
        return '\n'.join(lines)
    if isinstance(value, dict):
        if not value:
            return '{}'
        lines = ['{']
        for key, val in value.items():
            lines.append('    ' * (level + 1) + f"{key}: {js_value(val, level + 1)},")
        lines.append('    ' * level + '}')
        return '\n'.join(lines)
    raise TypeError(f'Unsupported type {type(value)}')


def default_config(fields):
    return {field['key']: field.get('default', '') for field in fields}


def parse_lines_expr(source: str) -> str:
    return (
        'String(' + source + ' || "").split(/\\r?\\n/).map(item => String(item || "").trim()).filter(item => item.length > 0)'
    )

def trigger_logic(spec):
    lt = spec['logic_type']
    lines = ['const clone = QuickActionContext.clone(context);']
    if lt == 'dawn_intentions':
        lines.extend([
            'const now = new Date();',
            'const focusLines = ' + parse_lines_expr('config?.focusAreas') + ';',
            'const fallbackFocus = ' + js_value(spec['focus_samples']) + ';',
            'const focusList = focusLines.length > 0 ? focusLines : fallbackFocus;',
            'const tone = String(config?.tone || "optimistic").trim() || "optimistic";',
            'const moodLines = ' + parse_lines_expr('config?.moodPalette') + ';',
            'const fallbackMood = ' + js_value(spec['mood_samples']) + ';',
            'const moodPalette = moodLines.length > 0 ? moodLines : fallbackMood;',
            'const markerLines = ' + parse_lines_expr('config?.timeMarkers') + ';',
            'const fallbackMarkers = ' + js_value(spec['marker_samples']) + ';',
            'const timeline = markerLines.length > 0 ? markerLines : fallbackMarkers;',
            'const affirmation = String(config?.affirmation || "I am building momentum with care.").trim();',
            'const statementLines = [];',
            'statementLines.push(`Focus for ${now.toLocaleDateString()} (${tone})`);',
            'statementLines.push("");',
            'statementLines.push("Primary focus pillars:");',
            'focusList.forEach((item, index) => statementLines.push(`- ${index + 1}. ${item}`));',
            'statementLines.push("");',
            'statementLines.push("Mood palette to embody:");',
            'moodPalette.forEach((mood, index) => {',
            '    const icon = index % 2 === 0 ? "•" : "◦";',
            '    statementLines.push(`  ${icon} ${mood}`);',
            '});',
            'statementLines.push("");',
            'statementLines.push("Timeline pulses:");',
            'timeline.forEach((entry, index) => {',
            '    const timeIcon = index === 0 ? "🌅" : (index === timeline.length - 1 ? "🌙" : "⏰");',
            '    statementLines.push(`  ${timeIcon} ${entry}`);',
            '});',
            'statementLines.push("");',
            'if (affirmation) {',
            '    statementLines.push("Affirmation:");',
            '    statementLines.push(`  ${affirmation}`);',
            '    statementLines.push("");',
            '}',
            'clone.payload = statementLines.join("\n");',
            'clone.vars.lastIntention = { tone, focusList, moodPalette, timeline, createdAt: now.toISOString() };',
            'clone.logs.push("Generated dawn intention planner block.");',
            'return [clone];'
        ])
    elif lt == 'theme_picker':
        lines.extend([
            'const themeLines = ' + parse_lines_expr('config?.themes') + ';',
            'const fallbackThemes = ' + js_value(spec['theme_samples']) + ';',
            'const themePool = themeLines.length > 0 ? themeLines : fallbackThemes;',
            'const anchorLines = ' + parse_lines_expr('config?.anchors') + ';',
            'const fallbackAnchors = ' + js_value(spec['anchor_samples']) + ';',
            'const anchorPool = anchorLines.length > 0 ? anchorLines : fallbackAnchors;',
            'const themeIndex = themePool.length > 0 ? Math.floor(Math.random() * themePool.length) : 0;',
            'const anchorCount = Math.max(3, Math.min(6, anchorPool.length));',
            'const selectedAnchors = anchorPool.slice(0, anchorCount);',
            'const chosenTheme = themePool[themeIndex] || "Impromptu theme";',
            'const summaryLines = [];',
            'summaryLines.push(`Theme spark: ${chosenTheme}`);',
            'summaryLines.push("");',
            'summaryLines.push("Anchors to explore:");',
            'selectedAnchors.forEach(anchor => summaryLines.push(`- ${anchor}`));',
            'if (config?.includeHistory && clone.payload) {',
            '    summaryLines.push("");',
            '    summaryLines.push("Context from previous payload:");',
            '    QuickActionTools.toText(clone.payload).split(/\r?\n/).slice(0, 5).forEach(line => summaryLines.push(`  > ${line}`));',
            '}',
            'clone.payload = summaryLines.join("\n");',
            'clone.vars.lastThemeSpark = { theme: chosenTheme, anchors: selectedAnchors };',
            'clone.logs.push("Generated random theme spark block.");',
            'return [clone];'
        ])
    elif lt == 'weekday_ritual':
        lines.extend([
            'const now = new Date();',
            'const weekday = now.toLocaleDateString(undefined, { weekday: "long" }).toLowerCase();',
            'const ritualEntries = ' + parse_lines_expr('config?.rituals') + ';',
            'const custom = {};',
            'ritualEntries.forEach(entry => {',
            '    const [day, ...rest] = entry.split(":");',
            '    if (!day || rest.length === 0) return;',
            '    const key = day.trim().toLowerCase();',
            '    const value = rest.join(":").trim();',
            '    if (!custom[key]) custom[key] = [];',
            '    custom[key].push(value);',
            '});',
            'const fallback = ' + js_value(spec['weekday_samples']) + ';',
            'const rituals = custom[weekday] && custom[weekday].length > 0 ? custom[weekday] : (fallback[weekday] || fallback.monday || []);',
            'const plan = [];',
            'plan.push(`Weekday ritual for ${weekday.charAt(0).toUpperCase() + weekday.slice(1)}`);',
            'plan.push("");',
            'rituals.slice(0, 5).forEach((item, index) => plan.push(`${index + 1}. ${item}`));',
            'if (config?.extraNotes) {',
            '    plan.push("");',
            '    plan.push("Notes:");',
            '    plan.push(`  ${config.extraNotes}`);',
            '}',
            'clone.payload = plan.join("\n");',
            'clone.vars.lastRitual = { weekday, rituals };',
            'clone.logs.push("Generated weekday ritual weaver block.");',
            'return [clone];'
        ])
    elif lt == 'monthly_reflection':
        lines.extend([
            'const now = new Date();',
            'const monthName = now.toLocaleDateString(undefined, { month: "long" });',
            'const monthIndex = now.getMonth();',
            'const seasonMap = ["winter", "winter", "spring", "spring", "spring", "summer", "summer", "summer", "autumn", "autumn", "autumn", "winter"];',
            'const season = seasonMap[monthIndex];',
            'const seasonIdeas = ' + js_value(spec['season_samples']) + ';',
            'const prompts = ' + js_value(spec['question_samples']) + ';',
            'const milestoneLines = ' + parse_lines_expr('config?.milestones') + ';',
            'const gratitudeLines = ' + parse_lines_expr('config?.gratitude') + ';',
            'const selectedPrompts = prompts.slice(0, 5);',
            'const reflection = [];',
            'reflection.push(`Reflection for ${monthName}`);',
            'reflection.push(`Season lens: ${season}`);',
            'reflection.push("");',
            'reflection.push("Season invitations:");',
            '(seasonIdeas[season] || []).forEach(item => reflection.push(`- ${item}`));',
            'if (milestoneLines.length > 0) {',
            '    reflection.push("");',
            '    reflection.push("Milestones worth celebrating:");',
            '    milestoneLines.forEach(item => reflection.push(`- ${item}`));',
            '}',
            'reflection.push("");',
            'reflection.push(`Learning focus: ${config?.learningFocus || "Growth with gentleness"}`);',
            'reflection.push("");',
            'reflection.push("Questions to explore:");',
            'selectedPrompts.forEach((prompt, index) => reflection.push(`${index + 1}. ${prompt}`));',
            'if (gratitudeLines.length > 0) {',
            '    reflection.push("");',
            '    reflection.push("Gratitude seeds:");',
            '    gratitudeLines.forEach(item => reflection.push(`- ${item}`));',
            '}',
            'clone.payload = reflection.join("\n");',
            'clone.vars.lastReflection = { month: monthName, season, prompts: selectedPrompts };',
            'clone.logs.push("Generated monthly reflection lens block.");',
            'return [clone];'
        ])
    elif lt == 'seasonal_checkin':
        lines.extend([
            'const now = new Date();',
            'const hemisphere = (config?.hemisphere || "north").toLowerCase() === "south" ? "south" : "north";',
            'const monthIndex = now.getMonth();',
            'const northMap = ["winter", "winter", "spring", "spring", "spring", "summer", "summer", "summer", "autumn", "autumn", "autumn", "winter"];',
            'const southMap = ["summer", "summer", "autumn", "autumn", "autumn", "winter", "winter", "winter", "spring", "spring", "spring", "summer"];',
            'const season = hemisphere === "south" ? southMap[monthIndex] : northMap[monthIndex];',
            'const seasonActions = ' + js_value(spec['season_actions']) + ';',
            'const customSupport = ' + parse_lines_expr('config?.customSupport') + ';',
            'const supportList = customSupport.length > 0 ? customSupport : (seasonActions[season] || []);',
            'const linesOut = [];',
            'linesOut.push(`Seasonal check-in: ${season}`);',
            'linesOut.push(`Hemisphere: ${hemisphere}`);',
            'linesOut.push("");',
            'supportList.slice(0, 6).forEach((item, index) => linesOut.push(`${index + 1}. ${item}`));',
            'clone.payload = linesOut.join("\n");',
            'clone.vars.lastSeasonCompass = { season, hemisphere, suggestions: supportList };',
            'clone.logs.push("Generated seasonal check-in compass block.");',
            'return [clone];'
        ])
    elif lt == 'creative_seed':
        lines.extend([
            'const conceptPool = ' + parse_lines_expr('config?.concepts') + ';',
            'const sensePool = ' + parse_lines_expr('config?.senses') + ';',
            'const verbPool = ' + parse_lines_expr('config?.actionVerbs') + ';',
            'const fallbackConcepts = ' + js_value(spec['concept_samples']) + ';',
            'const fallbackSenses = ' + js_value(spec['sense_samples']) + ';',
            'const fallbackVerbs = ' + js_value(spec['verb_samples']) + ';',
            'const concepts = conceptPool.length > 0 ? conceptPool : fallbackConcepts;',
            'const senses = sensePool.length > 0 ? sensePool : fallbackSenses;',
            'const verbs = verbPool.length > 0 ? verbPool : fallbackVerbs;',
            'const pick = list => list[Math.floor(Math.random() * list.length)] || "idea";',
            'const selectedConcept = pick(concepts);',
            'const selectedSense = pick(senses);',
            'const selectedVerb = pick(verbs);',
            'const promptLines = [];',
            'promptLines.push(`Creative seed: ${selectedConcept}`);',
            'promptLines.push(`Sensory hook: ${selectedSense}`);',
            'promptLines.push(`Action cue: ${selectedVerb}`);',
            'promptLines.push("");',
            'promptLines.push("Prompt questions:");',
            'promptLines.push(`- How does ${selectedVerb} change the experience?`);',
            'promptLines.push(`- Which textures describe ${selectedSense}?`);',
            'promptLines.push(`- Where could ${selectedConcept} live in daily life?`);',
            'clone.payload = promptLines.join("\n");',
            'clone.vars.lastCreativeSeed = { concept: selectedConcept, sense: selectedSense, action: selectedVerb };',
            'clone.logs.push("Generated creative seed mixer block.");',
            'return [clone];'
        ])
    elif lt == 'gratitude_flow':
        lines.extend([
            'const peopleLines = ' + parse_lines_expr('config?.people') + ';',
            'const momentLines = ' + parse_lines_expr('config?.moments') + ';',
            'const fallbackPeople = ' + js_value(spec['people_samples']) + ';',
            'const fallbackMoments = ' + js_value(spec['moment_samples']) + ';',
            'const people = peopleLines.length > 0 ? peopleLines : fallbackPeople;',
            'const moments = momentLines.length > 0 ? momentLines : fallbackMoments;',
            'const action = String(config?.supportingAction || "Share a thank-you note").trim();',
            'const flowLines = [];',
            'flowLines.push("Gratitude flow");',
            'flowLines.push("");',
            'flowLines.push("People to appreciate:");',
            'people.slice(0, 6).forEach(person => flowLines.push(`- ${person}`));',
            'flowLines.push("");',
            'flowLines.push("Moments worth remembering:");',
            'moments.slice(0, 6).forEach(moment => flowLines.push(`- ${moment}`));',
            'flowLines.push("");',
            'flowLines.push(`Follow-up action: ${action}`);',
            'clone.payload = flowLines.join("\n");',
            'clone.vars.lastGratitude = { people, moments, action };',
            'clone.logs.push("Generated gratitude flow starter block.");',
            'return [clone];'
        ])
    elif lt == 'vision_canvas':
        lines.extend([
            'const northStar = String(config?.northStar || "A welcoming platform for every voice").trim();',
            'const allyLines = ' + parse_lines_expr('config?.allies') + ';',
            'const signalLines = ' + parse_lines_expr('config?.signals') + ';',
            'const fallbackAllies = ' + js_value(spec['ally_samples']) + ';',
            'const fallbackSignals = ' + js_value(spec['signal_samples']) + ';',
            'const allies = allyLines.length > 0 ? allyLines : fallbackAllies;',
            'const signals = signalLines.length > 0 ? signalLines : fallbackSignals;',
            'const canvas = [];',
            'canvas.push(`North star: ${northStar}`);',
            'canvas.push("");',
            'canvas.push("Allies & contributors:");',
            'allies.slice(0, 6).forEach(ally => canvas.push(`- ${ally}`));',
            'canvas.push("");',
            'canvas.push("Signals of progress:");',
            'signals.slice(0, 6).forEach(signal => canvas.push(`- ${signal}`));',
            'clone.payload = canvas.join("\n");',
            'clone.vars.lastVisionCanvas = { northStar, allies, signals };',
            'clone.logs.push("Generated vision canvas igniter block.");',
            'return [clone];'
        ])
    elif lt == 'mood_compass':
        lines.extend([
            'const moods = ' + parse_lines_expr('config?.moods') + ';',
            'const cues = ' + parse_lines_expr('config?.cues') + ';',
            'const fallbackMoods = ' + js_value(spec['mood_samples']) + ';',
            'const fallbackCues = ' + js_value(spec['cue_samples']) + ';',
            'const palette = moods.length > 0 ? moods : fallbackMoods;',
            'const cuesList = cues.length > 0 ? cues : fallbackCues;',
            'const weight = Number(config?.primaryWeight) || 3;',
            'const summary = [];',
            'summary.push("Mood compass");',
            'summary.push("");',
            'palette.slice(0, 4).forEach((mood, index) => {',
            '    const emphasis = index === 0 ? weight : 1;',
            '    summary.push(`${index + 1}. ${mood} (weight ${emphasis})`);',
            '});',
            'summary.push("");',
            'summary.push("Guiding cues:");',
            'cuesList.slice(0, 6).forEach(cue => summary.push(`- ${cue}`));',
            'clone.payload = summary.join("\n");',
            'clone.vars.lastMoodCompass = { palette, cues: cuesList, weight };',
            'clone.logs.push("Generated mood compass calibrator block.");',
            'return [clone];'
        ])
    elif lt == 'daily_briefing':
        lines.extend([
            'const highlightLines = ' + parse_lines_expr('config?.highlights') + ';',
            'const constraintLines = ' + parse_lines_expr('config?.constraints') + ';',
            'const momentumLines = ' + parse_lines_expr('config?.momentumActions') + ';',
            'const fallbackHighlights = ' + js_value(spec['highlight_samples']) + ';',
            'const fallbackConstraints = ' + js_value(spec['constraint_samples']) + ';',
            'const fallbackMomentum = ' + js_value(spec['momentum_samples']) + ';',
            'const highlights = highlightLines.length > 0 ? highlightLines : fallbackHighlights;',
            'const constraints = constraintLines.length > 0 ? constraintLines : fallbackConstraints;',
            'const momentum = momentumLines.length > 0 ? momentumLines : fallbackMomentum;',
            'const briefing = [];',
            'briefing.push("Daily briefing");',
            'briefing.push("");',
            'briefing.push("Highlights:");',
            'highlights.slice(0, 5).forEach(item => briefing.push(`- ${item}`));',
            'briefing.push("");',
            'briefing.push("Constraints:");',
            'constraints.slice(0, 5).forEach(item => briefing.push(`- ${item}`));',
            'briefing.push("");',
            'briefing.push("Momentum actions:");',
            'momentum.slice(0, 5).forEach(item => briefing.push(`- ${item}`));',
            'if (config?.includePayloadSummary && clone.payload) {',
            '    briefing.push("");',
            '    briefing.push("Payload snapshot:");',
            '    QuickActionTools.toText(clone.payload).split(/\r?\n/).slice(0, 4).forEach(line => briefing.push(`  > ${line}`));',
            '}',
            'clone.payload = briefing.join("\n");',
            'clone.vars.lastBriefing = { highlights, constraints, momentum };',
            'clone.logs.push("Generated daily briefing builder block.");',
            'return [clone];'
        ])
    elif lt == 'story_prompt':
        lines.extend([
            'const protagonists = ' + parse_lines_expr('config?.protagonists') + ';',
            'const settings = ' + parse_lines_expr('config?.settings') + ';',
            'const twists = ' + parse_lines_expr('config?.twists') + ';',
            'const fallbackProtagonists = ' + js_value(spec['protagonist_samples']) + ';',
            'const fallbackSettings = ' + js_value(spec['setting_samples']) + ';',
            'const fallbackTwists = ' + js_value(spec['twist_samples']) + ';',
            'const pick = list => list[Math.floor(Math.random() * list.length)] || "character";',
            'const hero = pick(protagonists.length > 0 ? protagonists : fallbackProtagonists);',
            'const setting = pick(settings.length > 0 ? settings : fallbackSettings);',
            'const twist = pick(twists.length > 0 ? twists : fallbackTwists);',
            'const story = [];',
            'story.push(`Protagonist: ${hero}`);',
            'story.push(`Setting: ${setting}`);',
            'story.push(`Twist: ${twist}`);',
            'story.push("");',
            'story.push("Story sparks:");',
            'story.push(`- What does ${hero.toLowerCase()} want most?`);',
            'story.push(`- How does the setting challenge them?`);',
            'story.push(`- When does the twist appear?`);',
            'clone.payload = story.join("\n");',
            'clone.vars.lastStoryPrompt = { hero, setting, twist };',
            'clone.logs.push("Generated story prompt catalyst block.");',
            'return [clone];'
        ])
    elif lt == 'playlist_mood':
        lines.extend([
            'const tempos = ' + parse_lines_expr('config?.tempos') + ';',
            'const colours = ' + parse_lines_expr('config?.colours') + ';',
            'const visuals = ' + parse_lines_expr('config?.visuals') + ';',
            'const fallbackTempos = ' + js_value(spec['tempo_samples']) + ';',
            'const fallbackColours = ' + js_value(spec['colour_samples']) + ';',
            'const fallbackVisuals = ' + js_value(spec['visual_samples']) + ';',
            'const tempoList = tempos.length > 0 ? tempos : fallbackTempos;',
            'const colourList = colours.length > 0 ? colours : fallbackColours;',
            'const visualList = visuals.length > 0 ? visuals : fallbackVisuals;',
            'const playlist = [];',
            'playlist.push("Playlist mood board");',
            'playlist.push("");',
            'playlist.push("Tempo cues:");',
            'tempoList.slice(0, 5).forEach(item => playlist.push(`- ${item}`));',
            'playlist.push("");',
            'playlist.push("Colour palette:");',
            'colourList.slice(0, 5).forEach(item => playlist.push(`- ${item}`));',
            'playlist.push("");',
            'playlist.push("Visual imagery:");',
            'visualList.slice(0, 5).forEach(item => playlist.push(`- ${item}`));',
            'clone.payload = playlist.join("\n");',
            'clone.vars.lastPlaylistMood = { tempos: tempoList, colours: colourList, visuals: visualList };',
            'clone.logs.push("Generated playlist mood primer block.");',
            'return [clone];'
        ])
    else:
        lines.extend([
            'clone.logs.push("Trigger logic not implemented.");',
            'return [clone];'
        ])
    return lines

trigger_specs = [
    {
        'id': 'imagination-trigger-dawn-intentions',
        'name': 'Dawn intention planner',
        'description': 'Start the day by outlining focus areas, tone, and energy rituals.',
        'icon': 'sunrise',
        'accent': '#f97316',
        'tags': ['planning', 'mindset', 'ritual'],
        'fields': [
            {'key': 'tone', 'type': 'text', 'label': 'Tone for the day', 'placeholder': 'optimistic and calm', 'default': 'optimistic and calm'},
            {'key': 'affirmation', 'type': 'textarea', 'rows': 2, 'label': 'Personal affirmation', 'placeholder': 'I welcome progress in gentle steps.', 'default': 'I welcome progress in gentle steps.'},
            {'key': 'focusAreas', 'type': 'textarea', 'rows': 4, 'label': 'Focus areas (one per line)', 'placeholder': 'Deep work\\nCollaborative sync\\nLearning', 'default': ''},
            {'key': 'moodPalette', 'type': 'textarea', 'rows': 3, 'label': 'Mood palette (one per line)', 'placeholder': 'curiosity\\nstability\\nlight-hearted', 'default': ''},
            {'key': 'timeMarkers', 'type': 'textarea', 'rows': 3, 'label': 'Time markers', 'placeholder': 'Sunrise warm-up\\nMidday stretch\\nEvening reflection', 'default': ''}
        ],
        'logic_type': 'dawn_intentions',
        'focus_samples': [
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
            'Balance ambition with sustainable pacing'
        ],
        'mood_samples': [
            'curious brightness',
            'grounded optimism',
            'quiet bravery',
            'creative openness',
            'restorative patience',
            'playful experimentation',
            'gentle accountability',
            'thoughtful momentum',
            'empathetic listening',
            'calm determination'
        ],
        'marker_samples': [
            'Sunrise stretch and breathing',
            'Focused creation session',
            'Walk & reflect break',
            'Learning immersion',
            'Connection call or message',
            'Reset the environment',
            'Evening gratitude review'
        ]
    },
    {
        'id': 'imagination-trigger-random-theme',
        'name': 'Random theme spark',
        'description': 'Generate a playful theme and supporting anchors for the next session.',
        'icon': 'compass',
        'accent': '#38bdf8',
        'tags': ['creativity', 'spark', 'trigger'],
        'fields': [
            {'key': 'themes', 'type': 'textarea', 'rows': 5, 'label': 'Custom themes', 'placeholder': 'Lighthouse focus\\nPaper planes\\nPlayful structure', 'default': ''},
            {'key': 'anchors', 'type': 'textarea', 'rows': 4, 'label': 'Anchor ideas', 'placeholder': 'Collect metaphors\\nSketch quick scenarios\\nList vibrant verbs', 'default': ''},
            {'key': 'includeHistory', 'type': 'checkbox', 'label': 'Include context about previous payload if available', 'default': False}
        ],
        'logic_type': 'theme_picker',
        'theme_samples': [
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
            'Crisp mountain clarity'
        ],
        'anchor_samples': [
            'List three sounds that match the theme',
            'Sketch a quick storyboard in words',
            'Design a ritual that embodies the idea',
            'Collect metaphors from current work',
            'Rewrite a goal using this mood',
            'Describe the opposite of the theme',
            'Highlight a teammate who radiates this energy',
            'Note one experiment to run in the theme',
            'Capture a quote or lyric that fits',
            'Create a check-in question for later'
        ]
    },
    {
        'id': 'imagination-trigger-weekday-ritual',
        'name': 'Weekday ritual weaver',
        'description': 'Compose a micro-ritual tailored to the current weekday.',
        'icon': 'calendar',
        'accent': '#22c55e',
        'tags': ['routine', 'ritual', 'mindset'],
        'fields': [
            {'key': 'rituals', 'type': 'textarea', 'rows': 6, 'label': 'Preferred rituals', 'placeholder': 'Monday: Map priorities\\nTuesday: Share praise\\nWednesday: Midweek stretch', 'default': ''},
            {'key': 'extraNotes', 'type': 'textarea', 'rows': 3, 'label': 'Extra notes', 'placeholder': 'Add a playlist that suits the rhythm.', 'default': ''}
        ],
        'logic_type': 'weekday_ritual',
        'weekday_samples': {
            'monday': ['Reset expectations', 'Choose lighthouse tasks', 'Clear digital clutter'],
            'tuesday': ['Pair with someone for feedback', 'Document learnings', 'Celebrate a colleague'],
            'wednesday': ['Take a stretching pause', 'Refuel with inspiring reading', 'Review momentum'],
            'thursday': ['Prototype something tiny', 'Send gratitude notes', 'Prepare restful buffer'],
            'friday': ['Reflect on highlights', 'Archive and tidy', 'Plan a gentle closeout']
        }
    },
    {
        'id': 'imagination-trigger-monthly-reflection',
        'name': 'Monthly reflection lens',
        'description': 'Craft a reflection canvas based on the current month and momentum.',
        'icon': 'circle',
        'accent': '#a855f7',
        'tags': ['reflection', 'journaling', 'trigger'],
        'fields': [
            {'key': 'milestones', 'type': 'textarea', 'rows': 4, 'label': 'Milestones to consider', 'placeholder': 'Shipped feature alpha\\nHosted community session', 'default': ''},
            {'key': 'learningFocus', 'type': 'text', 'label': 'Learning focus', 'placeholder': 'Resilience and flow', 'default': 'Resilience and flow'},
            {'key': 'gratitude', 'type': 'textarea', 'rows': 3, 'label': 'Gratitude seeds', 'placeholder': 'Mentors\\nCollaborators\\nFresh perspectives', 'default': ''}
        ],
        'logic_type': 'monthly_reflection',
        'season_samples': {
            'winter': ['Protect energy with clear boundaries', 'Seek warmth in community gatherings', 'Curate small sparks of joy'],
            'spring': ['Experiment with playful prototypes', 'Invite feedback early', 'Embrace beginner wonder'],
            'summer': ['Amplify what is already working', 'Design celebrations for progress', 'Share knowledge outward'],
            'autumn': ['Archive lessons with care', 'Prepare new soil for ideas', 'Let go of what no longer fits']
        },
        'question_samples': [
            'What felt surprisingly easy this month?',
            'Where did curiosity lead the way?',
            'Which relationship grew stronger?',
            'What needs a gentle pause or ending?',
            'Which experiment deserves a sequel?',
            'What rhythms kept you steady?',
            'How did you show generosity?',
            'Where is there room for more play?'
        ]
    },
    {
        'id': 'imagination-trigger-seasonal-checkin',
        'name': 'Seasonal check-in compass',
        'description': 'Translate the current season into focus points and supportive actions.',
        'icon': 'feather',
        'accent': '#facc15',
        'tags': ['seasonal', 'mindfulness', 'trigger'],
        'fields': [
            {'key': 'hemisphere', 'type': 'select', 'label': 'Hemisphere', 'options': [
                {'value': 'north', 'label': 'Northern Hemisphere'},
                {'value': 'south', 'label': 'Southern Hemisphere'}
            ], 'default': 'north'},
            {'key': 'customSupport', 'type': 'textarea', 'rows': 3, 'label': 'Supportive habits', 'placeholder': 'Drink warm tea\\nSchedule daylight walks', 'default': ''}
        ],
        'logic_type': 'seasonal_checkin',
        'season_actions': {
            'spring': ['Open windows for fresh ideas', 'Invite new collaborators', 'Plant small experiments'],
            'summer': ['Simplify commitments', 'Celebrate progress loudly', 'Create space for rest'],
            'autumn': ['Harvest lessons learned', 'Refine goals for clarity', 'Share stories generously'],
            'winter': ['Protect reflective time', 'Layer supportive routines', 'Light candles of inspiration']
        }
    },
    {
        'id': 'imagination-trigger-creative-seed',
        'name': 'Creative seed mixer',
        'description': 'Blend random words and senses into a surprising creative brief.',
        'icon': 'aperture',
        'accent': '#fb7185',
        'tags': ['creativity', 'ideation', 'trigger'],
        'fields': [
            {'key': 'concepts', 'type': 'textarea', 'rows': 4, 'label': 'Concept seeds', 'placeholder': 'Paper garden\\nFloating city\\nCloud bakery', 'default': ''},
            {'key': 'senses', 'type': 'textarea', 'rows': 4, 'label': 'Sensory cues', 'placeholder': 'Warm cinnamon\\nEchoing laughter\\nSilver sparkles', 'default': ''},
            {'key': 'actionVerbs', 'type': 'textarea', 'rows': 3, 'label': 'Action verbs', 'placeholder': 'weave\\ncraft\\nilluminate', 'default': ''}
        ],
        'logic_type': 'creative_seed',
        'concept_samples': ['Pocket observatory', 'Rainforest chorus', 'Urban fireflies', 'Time-traveling notebook', 'Stardust archive', 'Midnight bakery', 'Cloudtop studio', 'Storytelling compass'],
        'sense_samples': ['the scent of pine needles', 'echoes of a friendly choir', 'soft linen textures', 'twinkling copper lights', 'footsteps on mosaic tiles', 'whispers of sea breeze'],
        'verb_samples': ['weave', 'sketch', 'compose', 'nurture', 'illuminate', 'anchor', 'orchestrate', 'braid']
    },
    {
        'id': 'imagination-trigger-gratitude-flow',
        'name': 'Gratitude flow starter',
        'description': 'Gather gratitude prompts and assemble a reflection flow.',
        'icon': 'heart',
        'accent': '#ef4444',
        'tags': ['gratitude', 'reflection', 'mindset'],
        'fields': [
            {'key': 'people', 'type': 'textarea', 'rows': 4, 'label': 'People to appreciate', 'placeholder': 'A mentor\\nA teammate\\nA neighbour', 'default': ''},
            {'key': 'moments', 'type': 'textarea', 'rows': 4, 'label': 'Moments worth savouring', 'placeholder': 'First sip of tea\\nUnexpected compliment', 'default': ''},
            {'key': 'supportingAction', 'type': 'text', 'label': 'Follow-up action', 'placeholder': 'Send a thank-you note', 'default': 'Send a thank-you note'}
        ],
        'logic_type': 'gratitude_flow',
        'people_samples': ['A thoughtful guide', 'A collaborator who listened', 'Someone cheering from afar', 'A neighbour who shared kindness', 'A creator whose work moved you', 'A family member who showed up'],
        'moment_samples': ['A moment of quiet sunrise', 'Hearing laughter during a call', 'Finding the perfect phrase', 'Receiving an encouraging message', 'Seeing someone else shine', 'Learning something unexpected']
    },
    {
        'id': 'imagination-trigger-vision-canvas',
        'name': 'Vision canvas igniter',
        'description': 'Sketch a vivid future snapshot with north stars and allies.',
        'icon': 'star',
        'accent': '#fbbf24',
        'tags': ['vision', 'strategy', 'trigger'],
        'fields': [
            {'key': 'northStar', 'type': 'text', 'label': 'North star headline', 'placeholder': 'A welcoming platform for every voice', 'default': 'A welcoming platform for every voice'},
            {'key': 'allies', 'type': 'textarea', 'rows': 4, 'label': 'Allies & contributors', 'placeholder': 'Community champions\\nProduct storytellers\\nAccessibility advocates', 'default': ''},
            {'key': 'signals', 'type': 'textarea', 'rows': 4, 'label': 'Signals of progress', 'placeholder': 'Messages of relief\\nShared celebrations\\nNew invitations', 'default': ''}
        ],
        'logic_type': 'vision_canvas',
        'ally_samples': ['Courageous testers', 'Storytelling partners', 'Quiet specialists', 'Curious new joiners', 'Community caretakers', 'Accessibility advocates'],
        'signal_samples': ['People returning with friends', 'Notes about feeling seen', 'Improved flow for new joiners', 'A calmer support inbox', 'Ideas spreading organically', 'Unexpected collaborations']
    },
    {
        'id': 'imagination-trigger-mood-compass',
        'name': 'Mood compass calibrator',
        'description': 'Check-in with multiple moods and choose guiding cues.',
        'icon': 'activity',
        'accent': '#34d399',
        'tags': ['mood', 'reflection', 'trigger'],
        'fields': [
            {'key': 'moods', 'type': 'textarea', 'rows': 4, 'label': 'Mood palette', 'placeholder': 'energised\\nsoft focus\\nsteady tides', 'default': ''},
            {'key': 'cues', 'type': 'textarea', 'rows': 4, 'label': 'Guiding cues', 'placeholder': 'move gently\\nshare warmth\\nprotect focus', 'default': ''},
            {'key': 'primaryWeight', 'type': 'number', 'label': 'Weight for first mood', 'default': 3}
        ],
        'logic_type': 'mood_compass',
        'mood_samples': ['energised', 'soft focus', 'reflective', 'curious', 'playful', 'steady tides', 'bold & bright', 'quiet repair'],
        'cue_samples': ['move gently', 'share warmth', 'protect focus', 'invite questions', 'celebrate progress', 'allow rest', 'document insights', 'pair with someone']
    },
    {
        'id': 'imagination-trigger-daily-briefing',
        'name': 'Daily briefing builder',
        'description': 'Assemble a daily brief with highlights, constraints, and momentum actions.',
        'icon': 'list',
        'accent': '#60a5fa',
        'tags': ['planning', 'briefing', 'trigger'],
        'fields': [
            {'key': 'highlights', 'type': 'textarea', 'rows': 4, 'label': 'Highlights to surface', 'placeholder': 'Prototype ready for review\\nCustomer story to share', 'default': ''},
            {'key': 'constraints', 'type': 'textarea', 'rows': 3, 'label': 'Constraints to respect', 'placeholder': 'Limited availability after 4pm\\nDependence on design review', 'default': ''},
            {'key': 'momentumActions', 'type': 'textarea', 'rows': 4, 'label': 'Momentum actions', 'placeholder': 'Share blockers early\\nSchedule feedback pulse\\nDocument quick wins', 'default': ''},
            {'key': 'includePayloadSummary', 'type': 'checkbox', 'label': 'Include summary of current payload', 'default': True}
        ],
        'logic_type': 'daily_briefing',
        'highlight_samples': ['Prototype is ready for review', 'New testimonial arrived', 'Team morale is lifting', 'Fresh idea from the community', 'Support queue cleared', 'Design handoff scheduled'],
        'constraint_samples': ['Bandwidth reduced after noon', 'Awaiting infrastructure green light', 'Need clarity on scope trade-offs', 'Only two review slots available'],
        'momentum_samples': ['Share blockers before stand-up', 'Invite async feedback early', 'Write a short status recap', 'Capture a demo clip', 'Send thanks to collaborators', 'Plan a mini-retro midweek']
    },
    {
        'id': 'imagination-trigger-story-prompt',
        'name': 'Story prompt catalyst',
        'description': 'Craft a narrative spark mixing protagonists, settings, and twists.',
        'icon': 'book-open',
        'accent': '#f472b6',
        'tags': ['storytelling', 'creative', 'trigger'],
        'fields': [
            {'key': 'protagonists', 'type': 'textarea', 'rows': 4, 'label': 'Protagonists', 'placeholder': 'Curious archivist\\nReluctant inventor\\nKind mischief-maker', 'default': ''},
            {'key': 'settings', 'type': 'textarea', 'rows': 4, 'label': 'Settings', 'placeholder': 'Hidden rooftop garden\\nFloating marketplace\\nQuiet train carriage', 'default': ''},
            {'key': 'twists', 'type': 'textarea', 'rows': 3, 'label': 'Twists', 'placeholder': 'Time pauses during laughter\\nMessages arrive as sketches', 'default': ''}
        ],
        'logic_type': 'story_prompt',
        'protagonist_samples': ['Curious archivist', 'Restless cartographer', 'Soft-spoken engineer', 'Retired stage magician', 'Community gardener', 'Night-shift poet'],
        'setting_samples': ['Hidden rooftop garden', 'Floating marketplace', 'Quiet midnight library', 'Submerged glass tunnel', 'Wandering lighthouse'],
        'twist_samples': ['Time pauses during laughter', 'Messages arrive as sketches', 'Gravity changes with music', 'Dreams become public art', 'Maps redraw themselves at dawn']
    },
    {
        'id': 'imagination-trigger-playlist-mood',
        'name': 'Playlist mood primer',
        'description': 'Generate a playlist-style mood board with tempo, colour, and imagery.',
        'icon': 'music',
        'accent': '#c084fc',
        'tags': ['music', 'mood', 'trigger'],
        'fields': [
            {'key': 'tempos', 'type': 'textarea', 'rows': 3, 'label': 'Tempo cues', 'placeholder': 'gentle lo-fi\\nupbeat synthwave\\nsteady piano', 'default': ''},
            {'key': 'colours', 'type': 'textarea', 'rows': 3, 'label': 'Colour palette', 'placeholder': 'amber glow\\ncobalt dusk\\nsilver morning', 'default': ''},
            {'key': 'visuals', 'type': 'textarea', 'rows': 3, 'label': 'Visual imagery', 'placeholder': 'City lights in the rain\\nSunlit notebooks', 'default': ''}
        ],
        'logic_type': 'playlist_mood',
        'tempo_samples': ['gentle lo-fi', 'steady piano', 'slow-building strings', 'playful brass', 'velvet ambient hum'],
        'colour_samples': ['amber glow', 'cobalt dusk', 'silver morning', 'rose quartz haze', 'midnight teal'],
        'visual_samples': ['City lights in the rain', 'Sunlit notebooks', 'Late-night studio lamp', 'Footprints along the shore', 'A quiet bustling cafe']
    }
]

def action_logic(spec):
    lt = spec['logic_type']
    lines = ['const clone = QuickActionContext.clone(context);']
    if lt == 'outline':
        lines.extend([
            'const sectionLines = ' + parse_lines_expr('config?.sections') + ';',
            'const fallbackSections = ' + js_value(spec['fallback_sections']) + ';',
            'const sections = sectionLines.length > 0 ? sectionLines : fallbackSections;',
            'const notes = ' + js_value(spec['style_notes']) + ';',
            'const title = String(config?.title || spec.titleFallback || "Creative outline").trim();',
            'const tone = String(config?.style || spec.styleFallback || "calm confidence").trim();',
            'const callToAction = String(config?.callToAction || "Identify next micro-step").trim();',
            'const payloadText = QuickActionTools.toText(clone.payload);',
            'const preview = payloadText ? payloadText.split(/\r?\n/).slice(0, 4) : [];',
            'const outline = [];',
            'outline.push(`${title} — outline (${tone})`);',
            'outline.push("");',
            'sections.forEach((section, index) => {',
            '    outline.push(`${index + 1}. ${section}`);',
            '    if (notes[index]) {',
            '        outline.push(`   • ${notes[index]}`);',
            '    }',
            '});',
            'if (preview.length > 0) {',
            '    outline.push("");',
            '    outline.push("Payload preview:");',
            '    preview.forEach(line => outline.push(`   > ${line}`));',
            '}',
            'outline.push("");',
            'outline.push(`Call to action: ${callToAction}`);',
            'clone.payload = outline.join("\n");',
            'clone.vars.lastOutline = { title, sections, tone, callToAction };',
            'clone.logs.push("Generated outline action block.");',
            'return [clone];'
        ])
    elif lt == 'storyboard':
        lines.extend([
            'const beatLines = ' + parse_lines_expr('config?.beats') + ';',
            'const fallbackBeats = ' + js_value(spec['fallback_beats']) + ';',
            'const beats = beatLines.length > 0 ? beatLines : fallbackBeats;',
            'const setting = String(config?.setting || spec.settingFallback || "an evolving workspace").trim();',
            'const tone = String(config?.tone || spec.toneFallback || "hopeful").trim();',
            'const cliffhanger = String(config?.cliffhanger || "Will momentum continue?").trim();',
            'const storyboard = [];',
            'storyboard.push(`Setting: ${setting}`);',
            'storyboard.push(`Tone: ${tone}`);',
            'storyboard.push("");',
            'storyboard.push("Story beats:");',
            'beats.forEach((beat, index) => storyboard.push(`${index + 1}. ${beat}`));',
            'storyboard.push("");',
            'storyboard.push(`Cliffhanger: ${cliffhanger}`);',
            'clone.payload = storyboard.join("\n");',
            'clone.vars.lastStoryboard = { setting, tone, beats, cliffhanger };',
            'clone.logs.push("Generated storyboard action block.");',
            'return [clone];'
        ])
    elif lt == 'agenda':
        lines.extend([
            'const topicLines = ' + parse_lines_expr('config?.topics') + ';',
            'const fallbackTopics = ' + js_value(spec['fallback_topics']) + ';',
            'const topics = topicLines.length > 0 ? topicLines : fallbackTopics;',
            'const preworkLines = ' + parse_lines_expr('config?.prework') + ';',
            'const fallbackPrework = ' + js_value(spec['fallback_prework']) + ';',
            'const prework = preworkLines.length > 0 ? preworkLines : fallbackPrework;',
            'const outcomeLines = ' + parse_lines_expr('config?.outcomes') + ';',
            'const fallbackOutcomes = ' + js_value(spec['fallback_outcomes']) + ';',
            'const outcomes = outcomeLines.length > 0 ? outcomeLines : fallbackOutcomes;',
            'const meetingName = String(config?.meetingName || spec.nameFallback || "Team sync").trim();',
            'const duration = String(config?.duration || spec.durationFallback || "45 minutes").trim();',
            'const agenda = [];',
            'agenda.push(`${meetingName} — agenda (${duration})`);',
            'agenda.push("");',
            'agenda.push("Topics:");',
            'topics.forEach((topic, index) => agenda.push(`${index + 1}. ${topic}`));',
            'agenda.push("");',
            'agenda.push("Prework:");',
            'prework.forEach(item => agenda.push(`- ${item}`));',
            'agenda.push("");',
            'agenda.push("Desired outcomes:");',
            'outcomes.forEach(item => agenda.push(`- ${item}`));',
            'clone.payload = agenda.join("\n");',
            'clone.vars.lastAgenda = { meetingName, duration, topics, prework, outcomes };',
            'clone.logs.push("Generated agenda action block.");',
            'return [clone];'
        ])
    elif lt == 'journey':
        lines.extend([
            'const stageLines = ' + parse_lines_expr('config?.stages') + ';',
            'const fallbackStages = ' + js_value(spec['fallback_stages']) + ';',
            'const stages = stageLines.length > 0 ? stageLines : fallbackStages;',
            'const emotionLines = ' + parse_lines_expr('config?.emotions') + ';',
            'const fallbackEmotions = ' + js_value(spec['fallback_emotions']) + ';',
            'const emotions = emotionLines.length > 0 ? emotionLines : fallbackEmotions;',
            'const opportunityLines = ' + parse_lines_expr('config?.opportunities') + ';',
            'const fallbackOpportunities = ' + js_value(spec['fallback_opportunities']) + ';',
            'const opportunities = opportunityLines.length > 0 ? opportunityLines : fallbackOpportunities;',
            'const persona = String(config?.persona || spec.personaFallback || "Curious explorer").trim();',
            'const journey = [];',
            'journey.push(`Journey map — persona: ${persona}`);',
            'journey.push("");',
            'stages.forEach((stage, index) => {',
            '    journey.push(`${index + 1}. ${stage}`);',
            '    if (emotions[index]) journey.push(`   • Emotion: ${emotions[index]}`);',
            '    if (opportunities[index]) journey.push(`   • Opportunity: ${opportunities[index]}`);',
            '});',
            'clone.payload = journey.join("\n");',
            'clone.vars.lastJourney = { persona, stages, emotions, opportunities };',
            'clone.logs.push("Generated journey map action block.");',
            'return [clone];'
        ])
    else:
        lines.extend([
            'clone.logs.push("Action logic not implemented.");',
            'return [clone];'
        ])
    return lines

def utility_logic(spec):
    lt = spec['logic_type']
    lines = ['const clone = QuickActionContext.clone(context);']
    if lt == 'line_crafter':
        lines.extend([
            'const linesIn = QuickActionTools.toText(clone.payload).split(/\r?\n/);',
            'const minLength = Number(config?.minLength);',
            'const maxLength = Number(config?.maxLength);',
            'const prefix = String(config?.prefix || spec.prefixFallback || "").trim();',
            'const suffix = String(config?.suffix || spec.suffixFallback || "").trim();',
            'const numbering = Boolean(config?.numbering);',
            'const filtered = linesIn.filter(line => {',
            '    const length = line.trim().length;',
            '    if (!Number.isNaN(minLength) && length < minLength) return false;',
            '    if (!Number.isNaN(maxLength) && length > maxLength) return false;',
            '    return line.trim().length > 0;',
            '});',
            'const transformed = filtered.map((line, index) => {',
            '    const numbered = numbering ? `${index + 1}. ${line.trim()}` : line.trim();',
            '    const withPrefix = prefix ? `${prefix} ${numbered}` : numbered;',
            '    return suffix ? `${withPrefix} ${suffix}` : withPrefix;',
            '});',
            'clone.payload = transformed.join("\n");',
            'clone.vars.lastLineCraft = { count: transformed.length, prefix, suffix, numbering };',
            'clone.logs.push("Processed payload with line crafter block.");',
            'return [clone];'
        ])
    elif lt == 'word_shaper':
        lines.extend([
            'const baseText = QuickActionTools.toText(clone.payload);',
            'const separator = String(config?.separator || spec.separatorFallback || ", ").trim();',
            'const mode = String(config?.mode || spec.modeFallback || "uppercase").trim();',
            'const decorate = String(config?.decorate || spec.decorateFallback || "").trim();',
            'const fallbackWords = ' + js_value(spec['fallback_words']) + ';',
            'let words = baseText.split(/[^\p{L}\p{N}]+/u).filter(Boolean);',
            'if (words.length === 0) {',
            '    words = fallbackWords;',
            '}',
            'const shaped = words.map((word, index) => {',
            '    let transformed = word;',
            '    switch (mode) {',
            '        case "lowercase":',
            '            transformed = word.toLowerCase();',
            '            break;',
            '        case "title":',
            '            transformed = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();',
            '            break;',
            '        case "alternating":',
            '            transformed = index % 2 === 0 ? word.toUpperCase() : word.toLowerCase();',
            '            break;',
            '        case "uppercase":',
            '        default:',
            '            transformed = word.toUpperCase();',
            '            break;',
            '    }',
            '    return decorate ? `${decorate}${transformed}${decorate}` : transformed;',
            '});',
            'clone.payload = shaped.join(separator);',
            'clone.vars.lastWordShaper = { mode, separator, decorate, count: shaped.length };',
            'clone.logs.push("Transformed payload with word shaper block.");',
            'return [clone];'
        ])
    elif lt == 'payload_metrics':
        lines.extend([
            'const text = QuickActionTools.toText(clone.payload);',
            'const linesList = text.split(/\r?\n/);',
            'const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;',
            'const charCount = text.length;',
            'const longest = linesList.reduce((max, line) => Math.max(max, line.length), 0);',
            'const shortest = linesList.filter(line => line.trim().length > 0).reduce((min, line) => Math.min(min, line.length), text.length || 0);',
            'const metrics = [];',
            'metrics.push("Payload metrics");',
            'metrics.push("");',
            'metrics.push(`Lines: ${linesList.length}`);',
            'metrics.push(`Words: ${wordCount}`);',
            'metrics.push(`Characters: ${charCount}`);',
            'metrics.push(`Longest line: ${longest}`);',
            'metrics.push(`Shortest line: ${shortest === text.length ? 0 : shortest}`);',
            'const sample = linesList.slice(0, 5).map(line => line.trim()).filter(Boolean);',
            'if (sample.length > 0) {',
            '    metrics.push("");',
            '    metrics.push("Sample:");',
            '    sample.forEach(line => metrics.push(`  • ${line}`));',
            '}',
            'clone.payload = metrics.join("\n");',
            'clone.vars.lastMetrics = { lines: linesList.length, wordCount, charCount, longest, shortest: shortest === text.length ? 0 : shortest };',
            'clone.logs.push("Generated payload metrics block.");',
            'return [clone];'
        ])
    elif lt == 'payload_weaver':
        lines.extend([
            'const listLines = ' + parse_lines_expr('config?.listEntries') + ';',
            'const fallbackEntries = ' + js_value(spec['fallback_entries']) + ';',
            'const entries = listLines.length > 0 ? listLines : fallbackEntries;',
            'const template = String(config?.template || spec.templateFallback || "{{entry}} — linked to payload").trim();',
            'const payloadText = QuickActionTools.toText(clone.payload);',
            'const weaved = entries.map((entry, index) => {',
            '    const tokenised = template.replace(/{{entry}}/g, entry).replace(/{{index}}/g, String(index + 1));',
            '    return tokenised.replace(/{{payload}}/g, payloadText);',
            '});',
            'clone.payload = weaved.join("\n");',
            'clone.vars.lastWeave = { entries, template };',
            'clone.logs.push("Generated payload weaver block.");',
            'return [clone];'
        ])
    else:
        lines.extend([
            'clone.logs.push("Utility logic not implemented.");',
            'return [clone];'
        ])
    return lines

action_specs = []

outline_profiles = [
    ('luminous', 'Luminous blueprint outline', '#38bdf8', 'radiant clarity'),
    ('grounded', 'Grounded framework outline', '#f97316', 'steady focus'),
    ('playful', 'Playful canvas outline', '#a855f7', 'imaginative energy'),
    ('resilient', 'Resilient script outline', '#22c55e', 'quiet determination'),
    ('curious', 'Curious matrix outline', '#f59e0b', 'exploratory tone'),
    ('soothing', 'Soothing journey outline', '#60a5fa', 'gentle pacing'),
    ('bold', 'Bold architecture outline', '#ef4444', 'energetic tempo'),
    ('delicate', 'Delicate manuscript outline', '#c084fc', 'soft resonance')
]

outline_keywords = ['Focus question', 'Signals to watch', 'Narrative arc', 'Risks & mitigations', 'Momentum checkpoints', 'Celebration moment', 'Supportive allies', 'Next experiments']
outline_styles = ['Invite candour in each section.', 'Include one delight example.', 'Balance data with emotion.', 'Note who to involve early.', 'Consider pacing for different energy levels.', 'Mark one bold stretch.', 'Add a gratitude line.', 'Keep language human and kind.']

for idx, (slug, name, accent, tone) in enumerate(outline_profiles, start=1):
    sections = [f"{descriptor} {keyword.lower()}" for descriptor, keyword in zip(['Spark', 'Anchor', 'Rhythm', 'Edge', 'Pulse', 'Celebration', 'Allies', 'Next step'], outline_keywords)]
    action_specs.append({
        'id': f'imagination-action-outline-{idx:02d}',
        'name': name,
        'description': 'Shape the payload into a layered outline ready for collaboration.',
        'icon': 'layers',
        'accent': accent,
        'tags': ['outline', 'structure', 'writing'],
        'fields': [
            {'key': 'title', 'type': 'text', 'label': 'Outline title', 'placeholder': name, 'default': name},
            {'key': 'sections', 'type': 'textarea', 'rows': 6, 'label': 'Custom sections', 'placeholder': '\\n'.join(sections[:6]), 'default': ''},
            {'key': 'style', 'type': 'text', 'label': 'Style note', 'placeholder': tone, 'default': tone},
            {'key': 'callToAction', 'type': 'text', 'label': 'Call to action', 'placeholder': 'Identify next micro-step', 'default': 'Identify next micro-step'}
        ],
        'logic_type': 'outline',
        'fallback_sections': sections,
        'style_notes': outline_styles,
        'titleFallback': name,
        'styleFallback': tone
    })

storyboard_profiles = [
    ('dawn-chapter', 'Dawn chapter storyboard', '#fde047', 'Soft sunrise lab', 'hopeful', 'How does the morning change our view?'),
    ('urban-echo', 'Urban echo storyboard', '#4ade80', 'City rooftop observatory', 'vibrant', 'What happens when the signal fades?'),
    ('midnight-atelier', 'Midnight atelier storyboard', '#2dd4bf', 'Late-night maker space', 'reflective', 'Who keeps the lantern lit?'),
    ('harbour-lights', 'Harbour lights storyboard', '#fb7185', 'Floating community hub', 'curious', 'Will the tide bring new allies?'),
    ('forest-canopy', 'Forest canopy storyboard', '#a3e635', 'Treehouse collaboration loft', 'grounded', 'What secret do the leaves whisper?'),
    ('desert-orbit', 'Desert orbit storyboard', '#f97316', 'Solar field studio', 'resolute', 'Can momentum survive the heat?')
]

for idx, (slug, name, accent, setting, tone, cliffhanger) in enumerate(storyboard_profiles, start=1):
    beats = [
        f"Opening beat: {setting} comes alive",
        'Inciting spark invites action',
        'A tension emerges from contrasting needs',
        'Allies respond with inventive support',
        'Unexpected insight reorients the path',
        'A pause to honour progress and adjust'
    ]
    action_specs.append({
        'id': f'imagination-action-storyboard-{idx:02d}',
        'name': name,
        'description': 'Transform ideas into a collaborative storyboard with beats and tone.',
        'icon': 'film',
        'accent': accent,
        'tags': ['story', 'narrative', 'creative'],
        'fields': [
            {'key': 'setting', 'type': 'text', 'label': 'Primary setting', 'placeholder': setting, 'default': setting},
            {'key': 'beats', 'type': 'textarea', 'rows': 6, 'label': 'Story beats', 'placeholder': '\\n'.join(beats), 'default': ''},
            {'key': 'tone', 'type': 'text', 'label': 'Tone', 'placeholder': tone, 'default': tone},
            {'key': 'cliffhanger', 'type': 'text', 'label': 'Cliffhanger', 'placeholder': cliffhanger, 'default': cliffhanger}
        ],
        'logic_type': 'storyboard',
        'fallback_beats': beats,
        'settingFallback': setting,
        'toneFallback': tone
    })

agenda_profiles = [
    ('alignment', 'Alignment cadence agenda', '#0ea5e9', '60 minutes'),
    ('retrospective', 'Retrospective reset agenda', '#facc15', '45 minutes'),
    ('brainstorm', 'Brainstorm studio agenda', '#f472b6', '50 minutes'),
    ('ops-scan', 'Operations scan agenda', '#34d399', '40 minutes'),
    ('design-review', 'Design spotlight agenda', '#60a5fa', '55 minutes'),
    ('care-circle', 'Care circle agenda', '#fb7185', '35 minutes')
]

agenda_topics = ['Share context frames', 'Review wins and learnings', 'Surface friction points', 'Explore experiments', 'Decide next commitments', 'Assign support partners']
agenda_prework = ['Read summary document', 'Gather one highlight', 'Note one friction point', 'Bring a reflection question']
agenda_outcomes = ['Aligned next step', 'Named support buddy', 'Captured learning note']

for idx, (slug, name, accent, duration) in enumerate(agenda_profiles, start=1):
    action_specs.append({
        'id': f'imagination-action-agenda-{idx:02d}',
        'name': name,
        'description': 'Compose a thoughtful meeting agenda with topics and outcomes.',
        'icon': 'clipboard',
        'accent': accent,
        'tags': ['agenda', 'meeting', 'planning'],
        'fields': [
            {'key': 'meetingName', 'type': 'text', 'label': 'Meeting name', 'placeholder': name, 'default': name},
            {'key': 'duration', 'type': 'text', 'label': 'Duration', 'placeholder': duration, 'default': duration},
            {'key': 'topics', 'type': 'textarea', 'rows': 5, 'label': 'Topics', 'placeholder': '\\n'.join(agenda_topics), 'default': ''},
            {'key': 'prework', 'type': 'textarea', 'rows': 4, 'label': 'Prework', 'placeholder': '\\n'.join(agenda_prework), 'default': ''},
            {'key': 'outcomes', 'type': 'textarea', 'rows': 4, 'label': 'Desired outcomes', 'placeholder': '\\n'.join(agenda_outcomes), 'default': ''}
        ],
        'logic_type': 'agenda',
        'fallback_topics': agenda_topics,
        'fallback_prework': agenda_prework,
        'fallback_outcomes': agenda_outcomes,
        'nameFallback': name,
        'durationFallback': duration
    })

journey_profiles = [
    ('newcomer', 'Newcomer welcome journey', '#22d3ee', 'Warm welcome guide'),
    ('creator', 'Creator launch journey', '#f87171', 'Creative founder'),
    ('mentor', 'Mentor support journey', '#8b5cf6', 'Guiding mentor'),
    ('community', 'Community uplift journey', '#0ea5e9', 'Community caretaker'),
    ('repair', 'Repair trust journey', '#10b981', 'Trust repair steward'),
    ('expansion', 'Expansion scouting journey', '#f97316', 'Opportunity scout')
]

journey_stages = ['Arrival moment', 'Orientation support', 'Active exploration', 'Connection boost', 'Reflection window', 'Renewed commitment']
journey_emotions = ['Curious anticipation', 'Slight overwhelm easing', 'Spark of possibility', 'Feeling seen and backed', 'Settled confidence', 'Motivated to share']
journey_opportunities = ['Clarify invitation message', 'Pair with a friendly buddy', 'Highlight creative playground', 'Celebrate community wins', 'Offer reflective prompts', 'Invite future collaboration']

for idx, (slug, name, accent, persona) in enumerate(journey_profiles, start=1):
    action_specs.append({
        'id': f'imagination-action-journey-{idx:02d}',
        'name': name,
        'description': 'Map stages, emotions, and opportunities for a key persona journey.',
        'icon': 'map',
        'accent': accent,
        'tags': ['journey', 'strategy', 'empathy'],
        'fields': [
            {'key': 'persona', 'type': 'text', 'label': 'Persona', 'placeholder': persona, 'default': persona},
            {'key': 'stages', 'type': 'textarea', 'rows': 6, 'label': 'Journey stages', 'placeholder': '\\n'.join(journey_stages), 'default': ''},
            {'key': 'emotions', 'type': 'textarea', 'rows': 6, 'label': 'Emotions', 'placeholder': '\\n'.join(journey_emotions), 'default': ''},
            {'key': 'opportunities', 'type': 'textarea', 'rows': 6, 'label': 'Opportunities', 'placeholder': '\\n'.join(journey_opportunities), 'default': ''}
        ],
        'logic_type': 'journey',
        'fallback_stages': journey_stages,
        'fallback_emotions': journey_emotions,
        'fallback_opportunities': journey_opportunities,
        'personaFallback': persona
    })

utility_specs = []

line_profiles = [
    ('tidy-echoes', 'Tidy echoes line crafter', '#38bdf8', '»', '↗'),
    ('gentle-steps', 'Gentle steps line crafter', '#34d399', '∙', ''),
    ('brisk-rhythm', 'Brisk rhythm line crafter', '#f97316', '•', '— keep moving'),
    ('quiet-notes', 'Quiet notes line crafter', '#a855f7', '~', ''),
    ('bold-drafts', 'Bold drafts line crafter', '#ef4444', '✓', '!'),
    ('soft-lights', 'Soft lights line crafter', '#60a5fa', '→', '')
]

for idx, (slug, name, accent, prefix, suffix) in enumerate(line_profiles, start=1):
    utility_specs.append({
        'id': f'imagination-utility-line-{idx:02d}',
        'name': name,
        'description': 'Filter and decorate payload lines for ready-to-share snippets.',
        'icon': 'align-left',
        'accent': accent,
        'tags': ['lines', 'formatting'],
        'fields': [
            {'key': 'minLength', 'type': 'number', 'label': 'Minimum length', 'default': 0},
            {'key': 'maxLength', 'type': 'number', 'label': 'Maximum length', 'default': 120},
            {'key': 'prefix', 'type': 'text', 'label': 'Prefix', 'placeholder': prefix, 'default': prefix},
            {'key': 'suffix', 'type': 'text', 'label': 'Suffix', 'placeholder': suffix, 'default': suffix},
            {'key': 'numbering', 'type': 'checkbox', 'label': 'Add numbering', 'default': True}
        ],
        'logic_type': 'line_crafter',
        'prefixFallback': prefix,
        'suffixFallback': suffix
    })

word_profiles = [
    ('spark-vocabulary', 'Spark vocabulary shaper', '#f59e0b', ', '),
    ('resonant-phrases', 'Resonant phrase shaper', '#10b981', ' · '),
    ('bold-syllables', 'Bold syllable shaper', '#f97316', ' / '),
    ('soft-mantras', 'Soft mantra shaper', '#a855f7', ' | '),
    ('clarity-beads', 'Clarity bead shaper', '#38bdf8', ' • '),
    ('curiosity-strings', 'Curiosity string shaper', '#c084fc', '; ')
]

fallback_words = ['curiosity', 'kindness', 'momentum', 'resonance', 'clarity', 'bravery', 'playfulness', 'care', 'focus', 'wonder']

for idx, (slug, name, accent, separator) in enumerate(word_profiles, start=1):
    utility_specs.append({
        'id': f'imagination-utility-words-{idx:02d}',
        'name': name,
        'description': 'Transform payload words with case and decoration options.',
        'icon': 'type',
        'accent': accent,
        'tags': ['words', 'formatting'],
        'fields': [
            {'key': 'mode', 'type': 'select', 'label': 'Mode', 'options': [
                {'value': 'uppercase', 'label': 'Uppercase'},
                {'value': 'lowercase', 'label': 'Lowercase'},
                {'value': 'title', 'label': 'Title case'},
                {'value': 'alternating', 'label': 'Alternating'}
            ], 'default': 'uppercase'},
            {'key': 'separator', 'type': 'text', 'label': 'Separator', 'placeholder': separator, 'default': separator},
            {'key': 'decorate', 'type': 'text', 'label': 'Decoration wrapper', 'placeholder': '*', 'default': ''}
        ],
        'logic_type': 'word_shaper',
        'fallback_words': fallback_words,
        'separatorFallback': separator,
        'modeFallback': 'uppercase',
        'decorateFallback': ''
    })

metrics_profiles = [
    ('payload-lens', 'Payload lens metrics', '#6366f1'),
    ('snapshot-insight', 'Snapshot insight metrics', '#f43f5e'),
    ('clarity-diagnostics', 'Clarity diagnostics metrics', '#22d3ee')
]

for idx, (slug, name, accent) in enumerate(metrics_profiles, start=1):
    utility_specs.append({
        'id': f'imagination-utility-metrics-{idx:02d}',
        'name': name,
        'description': 'Summarise payload metrics for quick insight and sharing.',
        'icon': 'bar-chart-2',
        'accent': accent,
        'tags': ['analysis', 'metrics'],
        'fields': [],
        'logic_type': 'payload_metrics'
    })

weaver_profiles = [
    ('payload-bouquet', 'Payload bouquet weaver', '#f472b6', '🌸 {{entry}} — tied to {{payload}}'),
    ('echo-weaver', 'Echo trail weaver', '#22c55e', 'Echo {{index}}: {{entry}} / reflection -> {{payload}}'),
    ('compass-thread', 'Compass thread weaver', '#facc15', '{{index}}) {{entry}} → anchor with {{payload}}'),
    ('gratitude-link', 'Gratitude link weaver', '#fb7185', '{{entry}} — appreciation amplified by {{payload}}')
]

for idx, (slug, name, accent, template) in enumerate(weaver_profiles, start=1):
    utility_specs.append({
        'id': f'imagination-utility-weaver-{idx:02d}',
        'name': name,
        'description': 'Combine list entries with the payload using creative templates.',
        'icon': 'link',
        'accent': accent,
        'tags': ['merge', 'creative'],
        'fields': [
            {'key': 'listEntries', 'type': 'textarea', 'rows': 5, 'label': 'Entries', 'placeholder': 'first spark\\nsecond path\\nthird ally', 'default': ''},
            {'key': 'template', 'type': 'text', 'label': 'Template', 'placeholder': template, 'default': template}
        ],
        'logic_type': 'payload_weaver',
        'fallback_entries': ['First thread', 'Second thread', 'Third thread', 'Fourth thread'],
        'templateFallback': template
    })

def module_to_js(spec):
    category = spec.get('category') or ('trigger' if spec in trigger_specs else ('action' if spec in action_specs else 'utility'))
    lines = ['{']
    lines.append(f"    id: {js_value(spec['id'])},")
    lines.append(f"    category: '{category}',")
    lines.append(f"    name: {js_value(spec['name'])},")
    lines.append(f"    description: {js_value(spec['description'])},")
    lines.append(f"    icon: {js_value(spec['icon'])},")
    lines.append(f"    accent: {js_value(spec['accent'])},")
    lines.append(f"    tags: {js_value(spec.get('tags', []), 1)},")
    inputs = [] if category == 'trigger' else [{'id': 'input', 'label': 'Input'}]
    outputs = [{'id': 'next', 'label': 'Next'}]
    lines.append(f"    inputs: {js_value(inputs, 1)},")
    lines.append(f"    outputs: {js_value(outputs, 1)},")
    lines.append(f"    defaultConfig: {js_value(default_config(spec.get('fields', [])), 1)},")
    lines.append(f"    form: {js_value(spec.get('fields', []), 1)},")
    if category == 'trigger':
        run_lines = trigger_logic(spec)
    elif category == 'action':
        run_lines = action_logic(spec)
    else:
        run_lines = utility_logic(spec)
    lines.append('    run: async (context, config) => {')
    for line in run_lines:
        lines.append('        ' + line)
    lines.append('    }')
    lines.append('}')
    return '\n'.join(lines)

modules = []
for spec in trigger_specs:
    spec = dict(spec)
    spec['category'] = 'trigger'
    modules.append(module_to_js(spec))

for spec in action_specs:
    spec = dict(spec)
    spec['category'] = 'action'
    modules.append(module_to_js(spec))

for spec in utility_specs:
    spec = dict(spec)
    spec['category'] = 'utility'
    modules.append(module_to_js(spec))

content = "function createQuickActionImaginationModules({ QuickActionContext, QuickActionTools }) {\n"
content += '    const QuickActionImaginationModules = [\n'
content += indent(',\n'.join(modules), '        ')
content += '\n    ];\n\n'
content += '    return QuickActionImaginationModules;\n}\n\nmodule.exports = createQuickActionImaginationModules;\n'

Path(OUTPUT).write_text(content)
print(f"Generated modules: {len(modules)}")
