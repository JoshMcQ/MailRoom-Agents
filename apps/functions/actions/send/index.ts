import { serve, z } from '../../deps.ts';
import { getServiceClient } from '../../_shared/client.ts';
import { errorResponse, jsonResponse } from '../../_shared/response.ts';
import { performSendAction } from '../../_shared/send_action.ts';

const payloadSchema = z.object({
  action_id: z.string().uuid()
});

serve(async (request) => {
  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('invalid payload', 400);
  }

  const supabase = getServiceClient();
  try {
    const result = await performSendAction(supabase, parsed.data.action_id);
    return jsonResponse(result);
  } catch (error) {
    return errorResponse((error as Error).message, 400);
  }
});
