export async function attachToDealStub(input: {
  projectId: string;
  dealId?: string;
  files: string[];
}) {
  const enabled = process.env.HUBSPOT_ENABLED === "true" && Boolean(process.env.HUBSPOT_ACCESS_TOKEN);
  return {
    adapter: "hubspot",
    status: enabled ? "attempted" : "stub",
    enabled,
    dealId: input.dealId || `STUB-DEAL-${input.projectId}`,
    attachments: input.files,
    note: enabled
      ? "HUBSPOT_ENABLED is true. This draft records a deal-attachment stub only."
      : "HubSpot deal attachment stub. No live CRM write is performed in this draft."
  };
}
