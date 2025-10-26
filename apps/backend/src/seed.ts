import { connectDB } from './config/database';
import Poll from './models/Poll';
import { v4 as uuidv4 } from 'uuid';

const samplePolls = [
  {
    title: 'What is your favorite programming language?',
    description: 'Let us know which language you prefer for development',
    options: ['JavaScript', 'Python', 'TypeScript', 'Go', 'Rust'],
  },
  {
    title: 'Best frontend framework in 2025?',
    description: 'Which framework do you think is the best?',
    options: ['React', 'Vue', 'Angular', 'Svelte', 'Solid'],
  },
  {
    title: 'Remote work or office?',
    description: 'Where do you prefer to work?',
    options: ['Fully Remote', 'Hybrid', 'Office Only', 'Flexible'],
  },
  {
    title: 'Favorite code editor?',
    options: ['VS Code', 'WebStorm', 'Vim', 'Sublime Text', 'Neovim'],
  },
];

async function seedDatabase() {
  try {
    await connectDB();
    
    console.log('Clearing existing polls...');
    await Poll.deleteMany({});
    
    console.log('Seeding database with sample polls...');
    
    for (const pollData of samplePolls) {
      const poll = new Poll({
        title: pollData.title,
        description: pollData.description,
        options: pollData.options.map((text) => ({
          id: uuidv4(),
          text,
          votes: 0,
        })),
        createdBy: 'seed-user',
        createdByName: 'System',
        totalVotes: 0,
        likes: 0,
      });
      
      await poll.save();
      console.log(`Created poll: ${poll.title}`);
    }
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
