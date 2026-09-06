import { Router } from "express";
import { meetings, team, leads, newId, saveToDisk } from "../data/store.js";
import whatsapp from "../integrations/whatsapp.js";

const router = Router();

// Calculate working hours slots (9:00 AM to 5:00 PM, 1-hour intervals)
const BASE_SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

// GET /api/meetings/slots?date=YYYY-MM-DD&repId=TEAM-X
router.get("/slots", (req, res) => {
  const dateStr = req.query.date || new Date().toISOString().split("T")[0];
  const repId = req.query.repId;

  const targetReps = repId
    ? team.filter((t) => t.id === repId && t.role === "sales")
    : team.filter((t) => t.role === "sales");

  const results = targetReps.map((rep) => {
    const isRepAvailable = rep.isAvailable !== false;
    const isDateDisabled = (rep.disabledDates || []).includes(dateStr);

    const slots = BASE_SLOTS.map((timeSlot) => {
      const isBooked = meetings.some((m) => {
        const mDate = m.dateStr || (m.scheduledAt ? m.scheduledAt.split("T")[0] : "");
        const mSlot = m.timeSlot || (m.scheduledAt ? new Date(m.scheduledAt).toISOString().split("T")[1]?.slice(0, 5) : "");
        return m.assignedTo === rep.id && mDate === dateStr && mSlot === timeSlot && m.status !== "Cancelled";
      });

      const isBlocked = (rep.blockedSlots || []).some(
        (b) => b.date === dateStr && b.time === timeSlot
      );

      let status = "available";
      if (isBooked) status = "booked";
      else if (!isRepAvailable || isDateDisabled || isBlocked) status = "disabled";

      return {
        timeSlot,
        formattedTime: formatSlotLabel(timeSlot),
        status,
        bookedBy: isBooked ? "Reserved" : null,
      };
    });

    return {
      repId: rep.id,
      repName: rep.name,
      repTitle: rep.title || "Property Specialist",
      rating: rep.rating || 4.8,
      reviewsCount: rep.reviewsCount || 100,
      avatar: rep.avatar || null,
      isAvailable: isRepAvailable && !isDateDisabled,
      date: dateStr,
      slots,
    };
  });

  res.json(results);
});

function formatSlotLabel(timeStr) {
  const [h] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:00 ${period}`;
}

// GET /api/meetings
router.get("/", (req, res) => res.json(meetings));

router.get("/lead/:leadId", (req, res) => {
  res.json(meetings.filter((m) => m.leadId === req.params.leadId));
});

// POST /api/meetings/book -> Atomic "Book My Show" Reservation Endpoint
router.post("/book", async (req, res) => {
  const { leadId, leadPhone, leadName, dateStr, timeSlot, repId } = req.body;

  if (!dateStr || !timeSlot || !repId) {
    return res.status(400).json({ error: "dateStr, timeSlot, and repId are required" });
  }

  // Atomic Double-Booking Protection Check
  const existingMeeting = meetings.find((m) => {
    const mDate = m.dateStr || (m.scheduledAt ? m.scheduledAt.split("T")[0] : "");
    const mSlot = m.timeSlot || (m.scheduledAt ? new Date(m.scheduledAt).toISOString().split("T")[1]?.slice(0, 5) : "");
    return m.assignedTo === repId && mDate === dateStr && mSlot === timeSlot && m.status !== "Cancelled";
  });

  if (existingMeeting) {
    return res.status(409).json({
      error: "This time slot has already been reserved by another client. Please choose another available slot.",
    });
  }

  const salesRep = team.find((t) => t.id === repId);
  const scheduledIso = `${dateStr}T${timeSlot}:00Z`;

  // Find or create lead in CRM database
  let targetLead = null;
  if (leadId) {
    const cleanId = leadId.replace("telegram:", "").trim();
    targetLead = leads.find(
      (l) =>
        l.id === leadId ||
        l.id === cleanId ||
        (l.phone && l.phone.includes(cleanId)) ||
        (l.telegramDetails && l.telegramDetails.senderId === cleanId)
    );
  }

  if (!targetLead && leadName) {
    targetLead = {
      id: newId("LEAD"),
      source: "website_booking",
      name: leadName || "Client",
      phone: leadPhone || "Not provided",
      email: null,
      requirement: "Property Consultation Meeting",
      budget: "Under review",
      status: "Meeting Scheduled",
      assignedTo: repId,
      assignedToName: salesRep?.name || "Property Advisor",
      createdAt: new Date().toISOString(),
      lastAction: {
        action: `Meeting booked with ${salesRep?.name} for ${dateStr} at ${formatSlotLabel(timeSlot)}`,
        performedBy: leadName || "Client",
        actorType: "system",
        timestamp: new Date().toISOString(),
      },
    };
    leads.unshift(targetLead);
  } else if (targetLead) {
    targetLead.assignedTo = repId;
    targetLead.assignedToName = salesRep?.name || repId;
    targetLead.status = "Meeting Scheduled";
    targetLead.lastAction = {
      action: `Meeting booked with ${salesRep?.name} for ${dateStr} at ${formatSlotLabel(timeSlot)}`,
      performedBy: leadName || targetLead.name || "Client",
      actorType: "system",
      timestamp: new Date().toISOString(),
    };
  }

  const meeting = {
    id: newId("MTG"),
    leadId: targetLead ? targetLead.id : (leadId || "LEAD-GUEST"),
    leadName: targetLead ? targetLead.name : (leadName || "Client"),
    leadPhone: targetLead ? targetLead.phone : (leadPhone || "Not provided"),
    scheduledAt: scheduledIso,
    dateStr,
    timeSlot,
    assignedTo: repId,
    assignedToName: salesRep?.name || repId,
    status: "Scheduled",
    reminderSent: false,
    isNewBooking: true,
    createdAt: new Date().toISOString(),
  };

  meetings.unshift(meeting);

  // WhatsApp Confirmation Dispatch
  try {
    const clientPhone = leadPhone || "+919876543210";
    await whatsapp.sendTextMessage({
      toNumber: clientPhone,
      message: `🎉 Meeting Confirmed! Your property consultation with ${salesRep?.name || "our team"} is set for ${dateStr} at ${formatSlotLabel(timeSlot)}. We look forward to meeting you!`,
    });
    meeting.reminderSent = true;
  } catch (err) {
    meeting.reminderError = err.message;
  }

  saveToDisk();

  res.status(201).json({
    ok: true,
    meeting,
    message: `Meeting successfully booked with ${salesRep?.name} for ${dateStr} at ${formatSlotLabel(timeSlot)}.`,
  });
});

// Admin manual meeting creation
router.post("/", async (req, res) => {
  const { leadId, scheduledAt, assignedTo, leadPhone } = req.body;
  const meeting = {
    id: newId("MTG"),
    leadId,
    scheduledAt,
    assignedTo,
    status: "Scheduled",
    reminderSent: false,
  };
  meetings.unshift(meeting);

  try {
    await whatsapp.sendTextMessage({
      toNumber: leadPhone,
      message: `Reminder: your meeting is scheduled for ${scheduledAt}.`,
    });
    meeting.reminderSent = true;
  } catch (err) {
    meeting.reminderError = err.message;
  }

  res.status(201).json(meeting);
});

router.patch("/:id", (req, res) => {
  const meeting = meetings.find((m) => m.id === req.params.id);
  if (!meeting) return res.status(404).json({ error: "Meeting not found" });
  Object.assign(meeting, req.body);
  saveToDisk();
  res.json(meeting);
});

// POST /api/meetings/:id/complete -> Sales Person marks Meeting Completed & dispatches Feedback Survey
router.post("/:id/complete", async (req, res) => {
  try {
    const meeting = meetings.find((m) => m.id === req.params.id);
    if (!meeting) return res.status(404).json({ error: "Meeting not found" });

    const { meetingSummary, completedBy } = req.body || {};

    meeting.status = "Completed";
    meeting.meetingSummary = meetingSummary || "Meeting completed successfully.";
    meeting.completedBy = completedBy || "Sales Rep";
    meeting.completedAt = new Date().toISOString();

    // Find and update lead status
    const targetLead = leads.find((l) => l.id === meeting.leadId || l.phone === meeting.leadPhone);
    if (targetLead) {
      targetLead.status = "Meeting Completed";
      targetLead.lastAction = {
        action: `Meeting completed by ${completedBy || "Sales Rep"}: "${meetingSummary || "Completed"}"`,
        performedBy: completedBy || "Sales Rep",
        actorType: "sales_rep",
        timestamp: new Date().toISOString(),
      };
    }

    saveToDisk();

    const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:5001";
    const feedbackUrl = `${baseUrl}/feedback?meetingId=${meeting.id}`;

    const feedbackMessage = `🎉 Thank you for meeting with our RealtyPulse Real Estate team today!\n\nWe would love your quick feedback on your consultation with ${meeting.assignedToName || "our specialist"}:\n👉 *Fill Out Survey:* ${feedbackUrl}\n\nYour feedback helps us provide the best property search experience!`;

    // 1. Dispatch Feedback on Telegram
    try {
      const { client: telegramClient } = await import("../integrations/telegram.js");
      if (telegramClient && telegramClient.connected) {
        const dialogs = await telegramClient.getDialogs({});
        const targetDialog = dialogs.find((d) => d.entity?.username === "Adwayth2007" || (d.title || d.name || "").includes("Adwayth")) || dialogs[0];
        if (targetDialog) {
          await telegramClient.sendMessage(targetDialog.inputEntity || targetDialog.id, { message: feedbackMessage });
          console.log(`✅ [Meeting Completed Feedback] Telegram feedback sent to "${targetDialog.title || targetDialog.name}"`);
        }
      }
    } catch (tErr) {
      console.warn(`[Telegram Feedback Dispatch Note] ${tErr.message}`);
    }

    // 2. Dispatch Feedback on WhatsApp
    try {
      await whatsapp.sendTextMessage({
        toNumber: meeting.leadPhone || targetLead?.phone || "+919633541720",
        message: feedbackMessage,
      });
      console.log(`✅ [Meeting Completed Feedback] WhatsApp feedback sent to ${meeting.leadPhone}`);
    } catch (wErr) {
      console.warn(`[WhatsApp Feedback Dispatch Note] ${wErr.message}`);
    }

    // 3. Dispatch Feedback on Email
    const clientEmail = targetLead?.email || req.body.email;
    if (clientEmail) {
      try {
        const { sendProposalEmail } = await import("../services/emailService.js");
        // Reuse nodemailer setup to send survey invitation
        await sendProposalEmail({
          toEmail: clientEmail,
          customerName: meeting.leadName,
          proposalId: `FEEDBACK-${meeting.id}`,
          pdfUrl: feedbackUrl,
          properties: [],
        });
      } catch (eErr) {
        console.warn(`[Email Feedback Dispatch Note] ${eErr.message}`);
      }
    }

    res.json({
      ok: true,
      meeting,
      feedbackUrl,
      message: "Meeting completed and feedback survey dispatched across channels successfully!",
    });
  } catch (err) {
    console.error(`❌ [Meeting Completion Error]`, err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
