import { connectDB } from './config/database';
import Poll from './models/Poll';
import { v4 as uuidv4 } from 'uuid';

const samplePolls = [
  {
    title: 'What is your favorite programming language?',
    description: 'Let us know which language you enjoy coding in the most.',
    options: ['JavaScript', 'Python', 'TypeScript', 'Go', 'Rust'],
  },
  {
    title: 'Best frontend framework in 2025?',
    description: 'Which frontend framework do you believe leads the way this year?',
    options: ['React', 'Vue', 'Angular', 'Svelte', 'Solid'],
  },
  {
    title: 'Remote work or office?',
    description: 'Share your thoughts on where you feel most productive.',
    options: ['Fully Remote', 'Hybrid', 'Office Only', 'Flexible'],
  },
  {
    title: 'Favorite code editor?',
    description: 'Which editor feels like home for your daily development workflow?',
    options: ['VS Code', 'WebStorm', 'Vim', 'Sublime Text', 'Neovim'],
  },
  {
    title: 'Preferred database for modern apps?',
    description: 'Pick the database you find most reliable for building apps.',
    options: ['MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Firebase'],
  },

  {
    title: 'What motivates you the most at work?',
    description: 'Select what truly inspires your best performance and growth.',
    options: ['Growth', 'Money', 'Work-life balance', 'Recognition', 'Passion'],
  },
  {
    title: 'Best time to be productive?',
    description: 'When during the day do you feel most focused and creative?',
    options: ['Early Morning', 'Afternoon', 'Evening', 'Late Night'],
  },
  {
    title: 'Would you prefer working at a startup or MNC?',
    description: 'Choose the type of workplace that matches your career goals.',
    options: ['Startup', 'MNC', 'Freelance', 'Own business'],
  },
  {
    title: 'Which soft skill is most important for success?',
    description: 'In your opinion, which soft skill makes the biggest impact at work?',
    options: ['Communication', 'Leadership', 'Adaptability', 'Problem-Solving'],
  },

  {
    title: 'Ideal weekend plan with loved ones?',
    description: 'How do you love spending quality time with your family or partner?',
    options: ['Movie night', 'Road trip', 'Dinner out', 'Stay home and relax'],
  },
  {
    title: 'What matters most in a relationship?',
    description: 'Choose the value you believe forms the foundation of love.',
    options: ['Trust', 'Communication', 'Respect', 'Compatibility'],
  },
  {
    title: 'How do you usually express love?',
    description: 'Different people show love differently — what’s your way?',
    options: ['Words', 'Actions', 'Gifts', 'Time spent together'],
  },

  {
    title: 'Pineapple on pizza — yay or nay?',
    description: 'A timeless debate! Share your honest opinion.',
    options: ['Absolutely!', 'Never!', 'Sometimes', 'Haven’t tried it'],
  },
  {
    title: 'If you could have one superpower, what would it be?',
    description: 'Imagine you could gain one incredible ability — what would you pick?',
    options: ['Invisibility', 'Time travel', 'Flying', 'Mind reading'],
  },
  {
    title: 'Which season do you love the most?',
    description: 'Everyone has a favorite time of year — what’s yours?',
    options: ['Spring', 'Summer', 'Autumn', 'Winter'],
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
