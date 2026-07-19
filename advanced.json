export async function loadLessonFile(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Unable to load lesson file: ${path}`);
  return response.json();
}
