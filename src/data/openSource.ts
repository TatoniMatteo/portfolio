export interface OpenSourceProject {
    owner: string;
    repo: string;
}

// Add repositories here; the section switches to a grid for multiple projects.
export const openSourceProjects: OpenSourceProject[] = [
    {owner: 'apache', repo: 'syncope'},
];
