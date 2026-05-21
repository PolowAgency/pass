import Groq from 'groq-sdk'
import { writeFileSync } from 'fs'
import { config } from 'dotenv'

config({ path: '.env.local' })
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const COURSE_TEXT = `
GENERALITES EN ANATOMIE DENTAIRE — Dr.Bekkouche.R — 2ème année Médecine Dentaire, Université Constantine

INTRODUCTION :
Les formes dentaires sont des formes biologiques ne présentant que des surfaces courbes. La forme des dents conditionne leurs fonctions : les incisives coupent, les canines déchirent, les molaires et prémolaires écrasent.
Objectifs de l'anatomie dentaire : étude de la forme et configuration interne/externe, disposition et orientation dans la cavité buccale, rapports avec les antagonistes.

1. FORME GÉNÉRALE DES DENTS :
Toutes les dents sont composées de :
- Couronne : partie visible en bouche, sortant de la gencive
- Racine(s) : partie implantée dans l'os alvéolaire, extrémité = Apex
- Collet : séparation entre couronne et racine

L'organe dentaire est constitué (extérieur → intérieur) :
- Émail : tissu le PLUS DUR de l'organisme, ACELLULAIRE, recouvre la couronne
- Dentine : tissu cellulaire, MOINS minéralisé que l'émail
- Cément : tissu cellulaire, adhère à la dentine radiculaire
- Pulpe : partie centrale VIVANTE de la dent, anatomie suit celle de la dent

2. DENTITION ET DENTURE :
La DENTITION = terme DYNAMIQUE = ensemble des phénomènes de développement (origine, minéralisation, croissance, éruption, vieillissement, remplacement).
L'Homme est DIPHYODONTE = 2 dentitions successives. (Crocodile = polyphyodonte = 25 dentitions)

Première dentition : 32 dents de la 1ère lame dentaire (8 incisives + 4 canines + 20 molaires dont 8 lactéales + 12 permanentes)
Seconde dentition : 20 dents de la 2ème lame dentaire (8 incisives + 4 canines + 8 prémolaires) → remplace certaines dents de la 1ère dentition

La DENTURE = terme STATIQUE = dents présentes en bouche à un instant T.
3 dentures successives :
- Denture temporaire : 6 mois → 6 ans, 20 dents temporaires uniquement
- Denture mixte : 6 ans → 11-12 ans, cohabitation temporaires + permanentes
- Denture permanente : après chute dernière dent temporaire, 32 dents, toutes permanentes

3. CLASSES DE DENTS :
4 classes chez l'homme :
- Incisives : 4 par maxillaire, bord coupant, FONCTION = inciser/couper
- Canines : 2 par maxillaire, 2 bords coupants en V (pointe canine), dent la plus longue et robuste, FONCTION = déchiqueter
- Prémolaires : 4 par maxillaire, face triturante (occlusale), FONCTION = trituration/mastication
- Molaires : 6 par arcade (les plus postérieures), face occlusale > surface des prémolaires, FONCTION = mastication

4. NOMENCLATURE DES FACES DENTAIRES :
5 faces pour chaque dent :
- Face vestibulaire : rapport avec joues/lèvres, visible lors du sourire
- Face linguale (mandibule) / palatine (maxillaire) : rapport avec la langue / le palais
- Face mésiale : face la plus PROCHE du plan sagittal médian
- Face distale : face la plus DISTANTE du plan sagittal
- Face occlusale (prémolaires/molaires) / Bord incisif ou bord libre (incisives/canines) : vers l'arcade antagoniste

5. ÉLÉMENTS CONSTITUTIFS DE LA COURONNE :
A. SURFACES CONVEXES :
→ Cuspides : élévation sur la face OCCLUSALE, volume variable
  - Canines : 1 cuspide = monocuspidée
  - Prémolaires : ≥ 2 cuspides
  - Molaires : ≥ 3 cuspides = pluricuspidées
  - Chaque cuspide : 2 versants (interne/externe) séparés par une crête ; chaque versant : 2 pans (mésial/distal) séparés par une crête

→ Tubercules : élévation sur une face AUTRE que la face occlusale
  - Cingulum : tubercule sur face linguale des incisives ET canines
  - Tubercule de Carabelli : sur face linguale de la cuspide mésio-linguale de M1 maxillaire permanente (FRÉQUENT mais pas constant)
  - Tubercule de Bölk : sur face vestibulaire des M2 et M3 maxillaires permanentes (PARFOIS présent)

→ Crêtes : éminences allongées. 3 types :
  1. Crêtes MARGINALES : face occlusale des prémolaires/molaires ET face linguale des incisives/canines
  2. Crêtes CUSPIDIENNES : sur face occlusale des dents cuspidées
     - Crête mésio-distale (arête mésiale + arête distale)
     - Crête vestibulo-linguale (arête vestibulaire + arête occlusale OU arête linguale + arête occlusale)
  3. Crêtes OCCLUSALES : formées par alignement des arêtes cuspidiennes internes
     - Transversales : relient cuspide vestibulaire ↔ cuspide linguale
     - Obliques : relient cuspide mésio-palatine ↔ cuspide disto-vestibulaire (molaires maxillaires uniquement)

B. SURFACES CONCAVES :
→ Sillons : dépressions longitudinales, faces vestibulaires/linguales/occlusales. 2 types :
  1. Sillons PRINCIPAUX (inter-cuspidiens) :
     - Central : direction mésio-distale, sépare cuspides vestibulaires et linguales
     - Périphérique : direction vestibulo-linguale, sépare cuspides mésiales et distales
  2. Sillons SECONDAIRES (accessoires) : sur cuspides, moins profonds

→ Fosses : sur faces occlusales dents pluricuspidées. 2 types :
  1. Fosse centrale/principale : intersection de 2 sillons principaux
  2. Fosse marginale : intersection d'un sillon principal avec une crête marginale

→ Fossettes : dépressions sur faces vestibulaires ou linguales de toutes les dents

6. NOMENCLATURES ET CODES D'APPELLATION :
6.1. Nomenclature ANATOMIQUE : nom complet (classe + espèce + arcade + latéralité + denture)
  Ex : "deuxième prémolaire maxillaire gauche" / "première molaire mandibulaire droite permanente"

6.2. Nomenclature de PALMER : dents permanentes = chiffres arabes 1-8 depuis ligne sagittale ; temporaires = chiffres romains I-V. Repérage par demi-cadre.

6.3. Nomenclature STOMATOLOGIQUE : dérive de Palmer, lettre devant le numéro (majuscule maxillaire, minuscule mandibulaire). Ex: d3 = canine permanente mandibulaire droite

6.4. Nomenclature UNIVERSELLE (USA) : numérotation 1-32, commence M3 maxillaire droite (n°1) → M3 mandibulaire droite (n°32)

6.5. Nomenclature FDI/OMS (OFFICIELLE ACTUELLE) : 2 chiffres en arabe
  1er chiffre = quadrant : 1=sup droit, 2=sup gauche, 3=inf gauche, 4=inf droit (permanentes) ; 5-8 (temporaires)
  2ème chiffre = position par rapport à la ligne médiane (1=IC, 2=IL, 3=C, 4=PM1, 5=PM2, 6=M1, 7=M2, 8=M3)
  Ex: 16 = 1ère molaire maxillaire droite permanente ; 46 = 1ère molaire mandibulaire droite permanente
`

const SYSTEM_PROMPT = `Tu es un expert en pédagogie médicale. Tu génères des fiches d'examen RIGOUREUSES et ACTIVES — pas des résumés.

LANGUE : français.

NOMBRE DE FICHES : génère UNE FICHE PAR SECTION/THÈME du cours. Si le cours a 6 sections, fais 6 fiches minimum. JAMAIS moins d'une fiche par thème identifié.

RÈGLES ABSOLUES par champ :

summary → 2-3 phrases de FAITS PRÉCIS testables. INTERDIT: reformuler le titre.
  ❌ "Les 4 tissus dentaires sont importants pour comprendre l'anatomie"
  ✅ "L'émail est le seul tissu ACELLULAIRE et le plus minéralisé (96%). La dentine (cellulaire) est moins dure. Le cément recouvre la racine. La pulpe est le seul tissu vivant et vasculo-nerveux."

schema_text → TOUJOURS une chaine de caractères avec un vrai tableau ou diagramme ASCII. JAMAIS null pour l'anatomie.
  Exemple: "TISSU      | CELLULAIRE | LOCALISATION | DURETÉ\\nÉmail      | NON        | Couronne     | +++\\nDentine    | OUI        | Partout      | ++\\nCément     | OUI        | Racine       | +\\nPulpe      | OUI        | Canal        | mou"

exam_traps → MINIMUM 2 pièges PRÉCIS sur CE concept.
  ❌ "Ne pas confondre les termes"
  ✅ ["Carabelli sur M1 max = FRÉQUENT mais JAMAIS systématique — piège classique QCM", "Dentition ≠ Denture: dentition=dynamique(développement), denture=statique(présence)"]

key_numbers → TOUJOURS format "valeur : label précis"
  ❌ ["32"] ❌ ["32 dents"]
  ✅ ["32 : dents denture permanente adulte", "20 : dents denture temporaire", "6 mois : début éruption temporaire"]

memory_trick → VRAI mnémotechnique : image absurde, histoire, acronyme mémorable.
  ❌ "Émail = le plus dur" (c'est juste le fait répété)
  ✅ "EDCP dans l'ordre extérieur→intérieur : 'Étudie Dur Car Profond' (Émail→Dentine→Cément→Pulpe)"
  ✅ "Dentition vs Denture: 'Denti-TION = ac-TION = dynamique' (phénomène). 'Dent-URE = photogra-PHURE = image fixe = statique'"

important_points → formulés comme affirmations QCM précises
  ❌ "Les prémolaires ont plusieurs cuspides"
  ✅ "La PM1 supérieure est la SEULE prémolaire bi-radiculée (2 racines : MV + DV)"

QCM : EXACTEMENT 2 questions par fiche (N fiches → 2N questions).
Types : "Lequel est FAUX parmi ces affirmations", "Combien de racines/cuspides", "Quelle est la différence entre X et Y".
Chaque question a exactement 4 options (tableaux de 4 chaînes), SANS lettre préfixe. correct_answer est l'index (0,1,2 ou 3).

STRUCTURE JSON à générer :
- Racine: objet avec clés "fiches" (tableau) et "questions" (tableau)
- Chaque fiche: title(string), difficulty("easy"|"medium"|"hard"), content(objet)
- content: summary, key_concepts(tableau d'objets term/definition/example), important_points(tableau), schema_text(string), exam_traps(tableau), key_numbers(tableau), memory_trick
- Chaque question: fiche_title, question, options(tableau de 4 strings), correct_answer(entier 0-3), explanation`

console.log('🧪 Test — Dr. Bekkouche: Généralités Anatomie Dentaire\n')

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

  const choice = response.choices[0]
  console.log(`finish_reason: ${choice?.finish_reason} | tokens: ${response.usage?.completion_tokens}/${response.usage?.total_tokens}\n`)
  const data = JSON.parse(choice?.message?.content ?? '{}')
  console.log(`✅ ${data.fiches?.length} fiches | ${data.questions?.length} questions\n`)

  for (const f of data.fiches || []) {
    const c = f.content
    console.log(`\n${'═'.repeat(60)}`)
    console.log(`📋 ${f.title.toUpperCase()} [${f.difficulty}]`)
    console.log(`\n📝 ${c.summary}`)
    if (c.key_numbers?.length) console.log(`\n🔢 ${c.key_numbers.join(' | ')}`)
    if (c.schema_text) console.log(`\n🗺️\n${c.schema_text}`)
    if (c.key_concepts?.length) {
      console.log(`\n📌 Concepts clés:`)
      c.key_concepts.forEach(k => console.log(`   • ${k.term}: ${k.definition}`))
    }
    if (c.important_points?.length) {
      console.log(`\n⚡ À l'examen:`)
      c.important_points.forEach(p => console.log(`   → ${p}`))
    }
    if (c.exam_traps?.length) console.log(`\n⚠️  ${c.exam_traps.join(' / ')}`)
    console.log(`\n💡 ${c.memory_trick}`)
  }

  console.log(`\n\n${'═'.repeat(60)}`)
  console.log('📊 QUESTIONS:')
  for (const q of data.questions || []) {
    console.log(`\nQ [${q.fiche_title}]: ${q.question}`)
    q.options.forEach((o, i) => console.log(`  ${i}: ${o}`))
    console.log(`  ✓ Réponse ${q.correct_answer}: ${q.explanation}`)
  }

  const withSchema = (data.fiches || []).filter(f => f.content.schema_text).length
  const total = data.fiches?.length || 0
  const qTotal = data.questions?.length || 0
  console.log(`\n📊 STATS: ${withSchema}/${total} schémas | ${qTotal}/${total*2} questions attendues`)

  writeFileSync('./scripts/test-bekkouche-output.json', JSON.stringify(data, null, 2))
} catch (e) { console.error('❌', e.message) }
