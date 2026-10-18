/** The About page copy, shared by the About overlay and the resume card. */
export interface Job {
  org: string;
  dates: string;
  role: string;
  body: string;
}

export const ABOUT_LEDE =
  'I’m Jatin. I was born in India and moved to the US when I was 7. I grew up in Houston and Southern California.';

export const WORK: Job[] = [
  {
    org: 'ZS Associates',
    dates: 'Jun 2025 – present',
    role: 'Associate Consultant, Strategy Insights & Planning',
    body: 'Led digital marketing operations for Amgen’s biggest brands: campaign strategy and execution across Salesforce Marketing Cloud and Data 360. Now I work on strategy for AI tools built for Amgen’s field team.',
  },
  {
    org: 'Molina Healthcare',
    dates: 'Aug 2024 – May 2025',
    role: 'Senior Business Analyst / Product Owner',
    body: 'Worked on digital channels: the care coordination portal and digitizing prior auth.',
  },
  {
    org: 'Infosys',
    dates: 'Jan 2021 – Aug 2024',
    role: 'Technology Analyst / Senior Associate Software Engineer',
    body: 'Started as a software engineer, ended up co-leading a 10-person team maintaining Molina’s systems.',
  },
];
