import Groq from 'groq-sdk'
import { writeFileSync } from 'fs'
import { config } from 'dotenv'

config({ path: '.env.local' })

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const COURSE_TEXT = `Cours d'Anatomie Dentaire - UCLouvain WDENT1121 - 2025

THÈMES : Nomenclature FDI, molaires sup/inf, prémolaires sup/inf, canines, incisives, anatomie endodontique, dents temporaires, rapports interdentaires.

CONTENU :
1. Nomenclature FDI (ISO 3950) : quadrants 1-4 adulte, 5-8 temporaire. 32 dents adultes, 20 temporaires.
   Numérotation : incisives centrales (11,21,31,41), latérales (12,22,32,42), canines (13,23,33,43), PM1 (14,24,34,44), PM2 (15,25,35,45), M1 (16,26,36,46), M2 (17,27,37,47), M3/sagesse (18,28,38,48)
   Faces dentaires : vestibulaire, linguale/palatine, mésiale, distale, occlusale/incisale
   Structure : Couronne (émail) — Collet — Racine (cément). Tissu interne : dentine + pulpe (tissu vasculonerveux) + canal radiculaire + foramen apical

2. Molaires supérieures (16,17) : 3 racines (MV, DV, palatine). 4-5 cuspides occlusales.
   M1 sup : 4 cuspides + 1 cuspide de Carabelli INCONSTANTE. Plus grosse dent du secteur postérieur sup.
   M2 sup : 4 cuspides, 3 racines, plus petite que M1.

3. Molaires inférieures (36,37) : 2 racines (mésiale + distale).
   M1 inf : 5 cuspides (3 vestibulaires + 2 linguales). Première dent permanente à faire éruption (6 ans).
   M2 inf : 4 cuspides (2 vestibulaires + 2 linguales).

4. 3ème molaires (dents de sagesse 18,28,38,48) : éruption 17-21 ans, très variables, souvent incluses.

5. Prémolaires supérieures :
   PM1 sup (14,24) : 2 racines (MV + DV) — SEULE prémolaire bi-radiculée. 2 cuspides (V + P).
   PM2 sup (15,25) : 1 racine, 2 cuspides. Plus petite que PM1.

6. Prémolaires inférieures :
   PM1 inf (34,44) : 1 racine, cuspide vestibulaire dominante + petite cuspide linguale.
   PM2 inf (35,45) : 1 racine, 2 cuspides plus équilibrées. Souvent 2 canaux (Type II Vertucci).

7. Canines (13,23,33,43) : 1 racine (LA PLUS LONGUE de l'arcade), 1 cuspide. Guide occlusal. Dent la plus stable.

8. Incisives supérieures : bord incisif tranchant, 1 racine.
   Centrale sup (11,21) : couronne trapézoïdale, angle mésio-incisif droit, angle disto-incisif arrondi.
   Latérale sup (12,22) : plus petite, racine parfois coudée.
   Incisives inférieures (31,41,32,42) : plus étroites, racine comprimée mésiodistalement.

9. Anatomie endodontique : chambre pulpaire (dans couronne) + canaux radiculaires (dans racines).
   Classification Vertucci : Type I (1 canal), II (2→1), III (1→2→1), IV (2 canaux séparés), V (1→2), VI (2→1→2), VII (1→2→1→2), VIII (3 canaux séparés).

10. Calendrier éruption permanente : M1 = 6 ans, IC inf = 6-7 ans, IC sup = 7-8 ans, IL = 8-9 ans, PM1 = 10-11 ans, PM2 = 11-12 ans, C = 11-13 ans, M2 = 12-14 ans, M3 = 17-21 ans.
    Denture temporaire (20 dents) : éruption 6-30 mois.

11. Rapports interdentaires : point de contact (zone de contact entre 2 dents adjacentes), embrasure (espace en V), articulé dentaire (overjet = surplomb horizontal, overbite = recouvrement vertical).`

const SYSTEM_PROMPT = `Expert pédagogie médicale/universitaire. Génère des fiches d'examen précises et actives.
LANGUE: français.
FICHES (8-15): summary = caractères DIFFÉRENTIELS testables (pas généralités). important_points = formulés comme QCM. schema_text = OBLIGATOIRE pour anatomie (tableau comparatif). exam_traps = piège PRÉCIS sur ce concept. key_numbers = TOUJOURS avec label ("3 : racines molaire sup" pas "3"). memory_trick = vrai mnémotechnique.
QCM: 2 questions PAR fiche (8 fiches = 16 questions OBLIGATOIRES). Options sans lettre préfixe.
JSON: {"fiches":[{"title":"str","content":{"summary":"str","key_concepts":[{"term":"str","definition":"str","example":"str"}],"important_points":["str"],"schema_text":"str|null","exam_traps":["str"],"key_numbers":["val:label"],"memory_trick":"str"},"difficulty":"easy"}],"questions":[{"fiche_title":"str","question":"str","options":["str","str","str","str"],"correct_answer":0,"explanation":"str"}]}`

console.log('🧪 Test de génération — Anatomie Dentaire\n')
console.log('Envoi à Groq llama-3.3-70b...\n')

try {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 8000,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Voici le contenu du cours :\n\n${COURSE_TEXT}` },
    ],
  })

  const raw = response.choices[0]?.message?.content ?? ''
  const data = JSON.parse(raw)

  console.log(`✅ ${data.fiches?.length} fiches générées, ${data.questions?.length} questions\n`)
  console.log('━'.repeat(60))

  for (let i = 0; i < Math.min(data.fiches.length, 5); i++) {
    const f = data.fiches[i]
    const c = f.content
    console.log(`\n📋 FICHE ${i+1}: ${f.title}`)
    console.log(`\n   📝 ${c.summary}`)
    if (c.key_numbers?.length > 0) console.log(`\n   🔢 ${c.key_numbers.join(' | ')}`)
    else console.log(`\n   🔢 ABSENT ❌`)
    if (c.schema_text) console.log(`\n   🗺️\n${c.schema_text.split('\n').map(l => '      '+l).join('\n')}`)
    else console.log(`\n   🗺️  ABSENT ❌`)
    if (c.exam_traps?.length > 0) console.log(`\n   ⚠️  ${c.exam_traps.join(' / ')}`)
    else console.log(`\n   ⚠️  ABSENT ❌`)
    console.log(`\n   💡 ${c.memory_trick}`)
    console.log('\n' + '─'.repeat(60))
  }

  // Questions sample
  console.log('\n📊 QUESTIONS SAMPLE (3 premières):')
  for (const q of (data.questions || []).slice(0, 3)) {
    console.log(`\n  Q: ${q.question}`)
    q.options.forEach((o, i) => console.log(`     ${i}: ${o}`))
    console.log(`  ✓ ${q.correct_answer} — ${q.explanation}`)
  }

  const withSchema = data.fiches.filter(f => f.content.schema_text).length
  const withNumbers = data.fiches.filter(f => f.content.key_numbers?.length > 0).length
  const withTraps = data.fiches.filter(f => f.content.exam_traps?.length > 0).length
  const questionsCount = data.questions?.length ?? 0
  const expectedQ = data.fiches.length * 3

  console.log(`\n📊 STATS: ${withSchema}/${data.fiches.length} schémas ${withSchema > data.fiches.length*0.5?'✅':'⚠️'} | ${withNumbers}/${data.fiches.length} chiffres ✅ | ${withTraps}/${data.fiches.length} pièges ✅ | ${questionsCount}/${expectedQ} questions ${questionsCount >= expectedQ*0.8?'✅':'⚠️'}`)

  writeFileSync('./scripts/test-output.json', JSON.stringify(data, null, 2))
  console.log('💾 JSON sauvegardé')

} catch (err) {
  console.error('❌ Erreur:', err.message)
}
