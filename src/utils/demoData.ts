// Data seeding utility for IndexedDB
import { fantasMiaDB, AMStory, AGStory, MediaAsset } from './indexedDB';

export const seedDemoData = async () => {
  try {
    // Demo user stories for AM (Archivio Magico)
    const demoUserStories: AMStory[] = [
      {
        id: 'am-story-1',
        ownerProfileId: 'demo-user',
        title: 'La Principessa e il Drago',
        text: 'C\'era una volta una principessa coraggiosa che viveva in un regno lontano. Un giorno, un drago cattivo rapì tutti i bambini del villaggio...',
        mode: 'Campbell',
        createdAt: new Date().toISOString(),
        hasImage: true
      },
      {
        id: 'am-story-2',
        ownerProfileId: 'demo-user',
        title: 'Il Gatto Magico',
        text: 'In una piccola casa vicino al bosco viveva un gatto molto speciale. Aveva il potere di parlare con gli animali e di far accadere cose incredibili...',
        mode: 'Propp',
        createdAt: new Date().toISOString(),
        hasImage: false
      },
      {
        id: 'am-story-3',
        ownerProfileId: 'demo-user',
        title: 'L\'Avventura nel Bosco Incantato',
        text: 'Marco e Sara stavano esplorando il bosco quando trovarono un sentiero segreto che li portò in un mondo magico pieno di creature fantastiche...',
        mode: 'CSS',
        createdAt: new Date().toISOString(),
        hasImage: true
      }
    ];

    // Demo SU stories for AG (Archivio Generale)
    const demoAGStories: AGStory[] = [
      {
        id: 'ag-reading-1',
        title: 'Il Piccolo Principe delle Stelle',
        content: 'In una galassia lontana, su un piccolo pianeta, viveva un principe che aveva il compito di prendersi cura delle stelle. Ogni notte accendeva una lanterna magica...',
        category: 'reading',
        created_by: 'superuser',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        has_image: true
      },
      {
        id: 'ag-reading-2',
        title: 'La Biblioteca dei Sogni',
        content: 'C\'era una biblioteca speciale dove i libri contenevano i sogni di tutti i bambini del mondo. La bibliotecaria magica aiutava i visitatori a trovare i sogni più belli...',
        category: 'reading',
        created_by: 'superuser',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        has_image: false
      },
      {
        id: 'ag-science-1',
        title: 'Il Viaggio della Goccia d\'Acqua',
        content: 'Una piccola goccia d\'acqua inizia un incredibile viaggio attraverso il ciclo dell\'acqua. Dal mare alle nuvole, dalla pioggia ai fiumi, scopre come la natura funziona...',
        category: 'science',
        created_by: 'superuser',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        has_image: true
      },
      {
        id: 'ag-science-2',
        title: 'L\'Avventura nel Corpo Umano',
        content: 'I globuli rossi Rosso e Rosa partono per un\'avventura attraverso il corpo umano, scoprendo come funzionano il cuore, i polmoni e tutti gli organi...',
        category: 'science',
        created_by: 'superuser',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        has_image: false
      }
    ];

    // Save demo data
    for (const story of demoUserStories) {
      await fantasMiaDB.saveAMStory(story);
    }

    for (const story of demoAGStories) {
      await fantasMiaDB.saveAGStory(story);
    }

    // Set current profile for demo
    localStorage.setItem('current_profile_id', 'demo-user');

    console.log('Demo data seeded successfully');
  } catch (error) {
    console.error('Error seeding demo data:', error);
  }
};

// Check if we need to seed data (only run once)
export const initializeDemoData = async () => {
  const hasSeeded = localStorage.getItem('fantas_mia_seeded');
  if (!hasSeeded) {
    await seedDemoData();
    localStorage.setItem('fantas_mia_seeded', 'true');
  }
};