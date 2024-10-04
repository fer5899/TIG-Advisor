import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { SlackAPIClient } from "deno-slack-sdk/types.ts";

import { SendAlertWorkflow } from "../workflows/send_alert.ts";
import { UsersToAlertDatastore } from "../datastores/users_to_alert.ts";

/**
 * ListenerSetupFunction creates a new trigger to listen for TIG announcements
 * in a specified channel. The trigger is used in the "Send Alert" workflow.
 */
export const ListenerSetupFunction = DefineFunction({
  callback_id: "listener_setup_function",
  title: "Setup Channel Listener",
  description:
    "Creates the trigger to listen for TIG announcements and saves in the datastore who to alert.",
  source_file: "functions/setup_channel_listener.ts",
  input_parameters: {
    properties: {
      channel: {
        type: Schema.slack.types.channel_id,
        description: "Channel to listen for TIG announcements",
      },
      user_to_alert: {
        type: Schema.slack.types.user_id,
        description: "The user who initiated the setup of the channel listener",
      },
    },
    required: ["channel"],
  },
});

export default SlackFunction(
  ListenerSetupFunction,
  async ({ inputs, client }) => {
    const { channel, user_to_alert } = inputs;

    const uuid = crypto.randomUUID();

    // Save information about the welcome message to the datastore
    const putResponse = await client.apps.datastore.put<
      typeof UsersToAlertDatastore.definition
    >({
      datastore: UsersToAlertDatastore.name,
      item: { id: uuid, channel, user_to_alert },
    });

    if (!putResponse.ok) {
      return { error: `Failed to save user to alert: ${putResponse.error}` };
    }

    // Search for any existing triggers for the welcome workflow
    const triggers = await findTIGMessageSentTrigger(client, channel);
    if (triggers.error) {
      return { error: `Failed to lookup existing triggers: ${triggers.error}` };
    }

    // Create a new user_joined_channel trigger if none exist
    if (!triggers.exists) {
      const newTrigger = await saveTIGMessageSentTrigger(client, channel);
      if (!newTrigger.ok) {
        return {
          error: `Failed to create trigger: ${newTrigger.error}`,
        };
      }
    }

    return { outputs: {} };
  },
);

/**
 * findUserJoinedChannelTrigger returns if the user_joined_channel trigger
 * exists for the "Send Welcome Message" workflow in a channel.
 */
export async function findTIGMessageSentTrigger(
  client: SlackAPIClient,
  channel: string,
): Promise<{ error?: string; exists?: boolean }> {
  // Collect all existing triggers created by the app
  const allTriggers = await client.workflows.triggers.list({ is_owner: true });
  if (!allTriggers.ok) {
    return { error: allTriggers.error };
  }

  // Find user_joined_channel triggers for the "Send Welcome Message"
  // workflow in the specified channel
  const joinedTriggers = allTriggers.triggers.filter((trigger) => (
    trigger.workflow.callback_id ===
      SendAlertWorkflow.definition.callback_id &&
    trigger.event_type === "slack#/events/user_joined_channel" &&
    trigger.channel_ids.includes(channel)
  ));

  // Return if any matching triggers were found
  const exists = joinedTriggers.length > 0;
  return { exists };
}

/**
 * saveUserJoinedChannelTrigger creates a new user_joined_channel trigger
 * for the "Send Welcome Message" workflow in a channel.
 */
export async function saveTIGMessageSentTrigger(
  client: SlackAPIClient,
  channel: string,
): Promise<{ ok: boolean; error?: string }> {
  const triggerResponse = await client.workflows.triggers.create<
    typeof SendAlertWorkflow.definition
  >({
    type: "event",
    name: "TIG Announcement Was Sent",
    description:
      "Triggered when a message containing 'TIG' is sent in the channel",
    workflow: `#/workflows/${SendAlertWorkflow.definition.callback_id}`,
    event: {
      event_type: "slack#/events/message_posted",
      channel_ids: [channel],
    },
    inputs: {
      channel: { value: channel },
    },
  });

  if (!triggerResponse.ok) {
    return { ok: false, error: triggerResponse.error };
  }
  return { ok: true };
}
