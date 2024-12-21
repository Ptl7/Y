export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { message } = req.body;

        // Implement the logic to call your LLaMA model here
        // This is a placeholder response
        const aiResponse = "Hello, this is a response from the AI!";

        res.status(200).json({ response: aiResponse });
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}
