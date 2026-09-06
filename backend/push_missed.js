const normalizedPayload = {
    channel: "telegram",
    conversationId: `telegram:1488306613`,
    customerId: "1488306613",
    customerName: "ᴍ̶ʀ̶.ᴊᴏᴋᴇʀ",
    message: "HIi",
    timestamp: new Date().toISOString(),
};
fetch(`http://localhost:5001/api/ai/incoming`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(normalizedPayload),
}).then(async res => {
    console.log(await res.json());
});
