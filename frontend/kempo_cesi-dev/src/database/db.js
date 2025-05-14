//db.js
import Dexie from 'dexie';
export const db = new Dexie('KempoCompetitionDB');

db.version(2).stores({
  categories: "++id, name",
  competitors: "++id, firstname, lastname, nationality, age, danLevel, grade, gender, clubName, registrationNumber, *teamId",
  logs: '++id, level, message, timestamp',
  poules: "++id, name, tournamentId, categoryId, *competitors",
  teams: "++id, name, *photo",
  tournaments: "++id, tournamentId, name, date, location, organizer, *competitors, *categories, matchType"
})

db.on('populate', async () => {
  try {
    await db.competitors.bulkAdd([
      { id: 1, firstname: 'Jean', lastname: 'Dupont', clubName: 'Kempo Club Paris', grade: '1 Dan', gender: 'Male', age: 28 },
      { id: 2, firstname: 'Marie', lastname: 'Durand', clubName: 'Bushido Académie', grade: '1 Kyu', gender: 'Female', age: 22 },
      { id: 3, firstname: 'Lucas', lastname: 'Martin', clubName: 'Kempo Club Lyon', grade: '2 Dan', gender: 'Male', age: 35 },
      { id: 4, firstname: 'Chloe', lastname: 'Bernard', clubName: 'Kempo Club Paris', grade: '1 Kyu', gender: 'Female', age: 24 },
      { id: 5, firstname: 'Hugo', lastname: 'Petit', clubName: 'Bushido Académie', grade: '3 Kyu', gender: 'Male', age: 19 },
      { id: 6, firstname: 'Lea', lastname: 'Robert', clubName: 'Kempo Club Lyon', grade: '1 Dan', gender: 'Female', age: 30 },
      { id: 7, firstname: 'Arthur', lastname: 'Richard', clubName: 'Kempo Club Paris', grade: '2 Kyu', gender: 'Male', age: 21 },
      { id: 8, firstname: 'Manon', lastname: 'Moreau', clubName: 'Bushido Académie', grade: 'Shodan Ho', gender: 'Female', age: 26 }
    ]);
    console.log('Base de données peuplée avec des compétiteurs de test.');
  } catch (error) {
    console.error("Erreur lors du peuplement de la base de données :", error);
  }
});
