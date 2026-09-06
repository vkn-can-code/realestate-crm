const apiKey = "AQ.Ab8RN6LZXkXv3Nb6MVaeGLIZeU97LQEy9WjZCOcjMYNfXuF0yA";
const modelName = "gemini-3.5-flash"; // testing
const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
}).then(async res => {
    console.log("Status:", res.status);
    console.log(await res.text());
});
