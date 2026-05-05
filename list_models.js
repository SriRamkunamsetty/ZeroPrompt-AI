async function run() {
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1/models?key=AIzaSyCLxRRefAEICnzCY-0Kh9M4luwmJ8Ty79k");
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}

run();
