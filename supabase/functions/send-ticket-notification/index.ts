import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TicketNotificationRequest {
  type: "created" | "status_changed";
  ticketNumber: string;
  ticketTitle: string;
  ticketDescription?: string;
  priority?: string;
  oldStatus?: string;
  newStatus?: string;
  creatorEmail?: string;
  assigneeEmail?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      type,
      ticketNumber,
      ticketTitle,
      ticketDescription,
      priority,
      oldStatus,
      newStatus,
      creatorEmail,
      assigneeEmail,
    }: TicketNotificationRequest = await req.json();

    console.log("Sending ticket notification:", { type, ticketNumber, ticketTitle });

    const recipients: string[] = [];
    if (creatorEmail) recipients.push(creatorEmail);
    if (assigneeEmail && assigneeEmail !== creatorEmail) recipients.push(assigneeEmail);

    if (recipients.length === 0) {
      console.log("No recipients to notify");
      return new Response(
        JSON.stringify({ message: "No recipients to notify" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    let subject: string;
    let htmlContent: string;

    if (type === "created") {
      subject = `New Ticket: ${ticketNumber} - ${ticketTitle}`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 20px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Ticket Created</h1>
          </div>
          <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Ticket Number</p>
              <p style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">${ticketNumber}</p>
              
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Title</p>
              <p style="margin: 0 0 16px 0; color: #111827; font-size: 16px;">${ticketTitle}</p>
              
              ${ticketDescription ? `
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Description</p>
                <p style="margin: 0 0 16px 0; color: #111827; font-size: 14px;">${ticketDescription}</p>
              ` : ''}
              
              ${priority ? `
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Priority</p>
                <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; text-transform: capitalize; background: ${priority === 'critical' ? '#fef2f2' : priority === 'high' ? '#fffbeb' : priority === 'medium' ? '#f0f9ff' : '#f9fafb'}; color: ${priority === 'critical' ? '#dc2626' : priority === 'high' ? '#d97706' : priority === 'medium' ? '#2563eb' : '#6b7280'};">${priority}</span>
              ` : ''}
            </div>
            <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 12px; text-align: center;">
              This is an automated notification from Intellinks East Africa Helpdesk
            </p>
          </div>
        </div>
      `;
    } else {
      subject = `Ticket Updated: ${ticketNumber} - Status changed to ${newStatus}`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 20px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Ticket Status Updated</h1>
          </div>
          <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Ticket Number</p>
              <p style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">${ticketNumber}</p>
              
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Title</p>
              <p style="margin: 0 0 16px 0; color: #111827; font-size: 16px;">${ticketTitle}</p>
              
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Status Change</p>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; text-transform: capitalize; background: #f3f4f6; color: #6b7280;">${oldStatus || 'unknown'}</span>
                <span style="color: #9ca3af;">→</span>
                <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; text-transform: capitalize; background: ${newStatus === 'resolved' ? '#d1fae5' : newStatus === 'closed' ? '#f3f4f6' : newStatus === 'in-progress' ? '#dbeafe' : '#fef3c7'}; color: ${newStatus === 'resolved' ? '#059669' : newStatus === 'closed' ? '#6b7280' : newStatus === 'in-progress' ? '#2563eb' : '#d97706'};">${newStatus}</span>
              </div>
            </div>
            <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 12px; text-align: center;">
              This is an automated notification from Intellinks East Africa Helpdesk
            </p>
          </div>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "Intellinks Helpdesk <onboarding@resend.dev>",
      to: recipients,
      subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-ticket-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
