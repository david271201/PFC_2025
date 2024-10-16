export default async function fetcher(input: string, init?: RequestInit) {
  const response = await fetch(input, init);

  return response.json();
}
