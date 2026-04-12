import { PrismaClient, RpgSystem, CampaignMode } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.embedding.deleteMany();
  await prisma.message.deleteMany();
  await prisma.story.deleteMany();
  await prisma.character.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.user.deleteMany();

  // Create sample user
  const user = await prisma.user.create({
    data: {
      discordId: '123456789',
      username: 'DungeonMaster42',
    },
  });

  // Create 2 characters
  const fighter = await prisma.character.create({
    data: {
      userId: user.id,
      name: 'Sir Galahad',
      class: 'Fighter',
      level: 5,
      hp: 45,
      maxHp: 52,
      rpgSystem: RpgSystem.dnd5e,
      stats: {
        strength: 16,
        dexterity: 12,
        constitution: 14,
        intelligence: 8,
        wisdom: 10,
        charisma: 13,
      },
      inventory: [
        { name: 'Longsword', type: 'weapon', equipped: true },
        { name: 'Shield', type: 'armor', equipped: true },
        { name: 'Health Potion', type: 'consumable', quantity: 3 },
      ],
      backstory: 'A knight errant seeking the Holy Grail.',
    },
  });

  const rogue = await prisma.character.create({
    data: {
      userId: user.id,
      name: 'Shadow',
      class: 'Rogue',
      level: 3,
      hp: 22,
      maxHp: 26,
      rpgSystem: RpgSystem.dnd5e,
      stats: {
        strength: 10,
        dexterity: 18,
        constitution: 12,
        intelligence: 14,
        wisdom: 11,
        charisma: 15,
      },
      inventory: [
        { name: 'Dagger', type: 'weapon', equipped: true },
        { name: "Thieves' Tools", type: 'tool', equipped: true },
        { name: 'Lockpick Set', type: 'tool', quantity: 5 },
      ],
      backstory: 'A mysterious figure from the shadows.',
    },
  });

  // Create campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: 'The Lost Temple',
      description: 'An ancient temple holds secrets of a forgotten god.',
      rpgSystem: RpgSystem.dnd5e,
      mode: CampaignMode.sharedSession,
      dmUserId: user.id,
      guildId: '987654321',
      channelId: '111222333444555',
      players: [user.discordId],
      worldState: {
        templeDiscovered: true,
        bossDefeated: false,
        treasuresFound: 2,
      },
    },
  });

  // Link characters to campaign
  await prisma.character.update({
    where: { id: fighter.id },
    data: { campaignId: campaign.id },
  });
  await prisma.character.update({
    where: { id: rogue.id },
    data: { campaignId: campaign.id },
  });

  // Create story
  const story = await prisma.story.create({
    data: {
      campaignId: campaign.id,
      scenes: [
        {
          title: 'The Discovery',
          description: 'The party discovers the entrance to the ancient temple.',
          npcs: ['Old Sage', 'Temple Guardian'],
          items: ['Ancient Map'],
        },
        {
          title: 'The Trap',
          description: 'The party triggers a trap in the entrance hallway.',
          npcs: ['Temple Guardian'],
          items: [],
        },
      ],
      currentSceneIndex: 0,
      summary: 'The adventure begins at the entrance of the Lost Temple.',
    },
  });

  console.log('Seed complete:');
  console.log(`  User: ${user.username}`);
  console.log(`  Characters: ${fighter.name}, ${rogue.name}`);
  console.log(`  Campaign: ${campaign.name}`);
  console.log(`  Story: ${story.summary}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
