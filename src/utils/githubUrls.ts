export interface GithubRepoConfig {
  username: string;
  repo: string;
  branch: string;
}

export interface GithubUrls {
  versionUrl: string;
  songsUrl: string;
}

export function buildGithubUrls(config: GithubRepoConfig): GithubUrls {
  const { username, repo, branch } = config;
  const base = `https://raw.githubusercontent.com/${username}/${repo}/${branch}`;
  return {
    versionUrl: `${base}/version.json`,
    songsUrl: `${base}/songs.json`,
  };
}

export function formatRepoSummary(config: GithubRepoConfig): string {
  return `${config.username}/${config.repo}@${config.branch}`;
}
