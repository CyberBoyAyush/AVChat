/**
 * Appwrite Realtime Service
 * 
 * Provides realtime subscriptions to Appwrite events for data synchronization.
 * UI state is updated directly from Appwrite events with no local DB.
 */

import { Client, RealtimeResponseEvent } from 'appwrite';
import { client } from './appwrite';
import {
  DATABASE_ID,
  THREADS_COLLECTION_ID,
  MESSAGES_COLLECTION_ID,
  MESSAGE_SUMMARIES_COLLECTION_ID,
  PROJECTS_COLLECTION_ID,
  AppwriteThread,
  AppwriteMessage,
  AppwriteMessageSummary,
  AppwriteProject
} from './appwriteDB';

// Object to store callback events for UI updates
type RealtimeCallbacks = {
  onThreadCreated?: (thread: AppwriteThread) => void;
  onThreadUpdated?: (thread: AppwriteThread) => void;
  onThreadDeleted?: (thread: AppwriteThread) => void;
  onMessageCreated?: (message: AppwriteMessage) => void;
  onMessageUpdated?: (message: AppwriteMessage) => void;
  onMessageDeleted?: (message: AppwriteMessage) => void;
  onMessageSummaryCreated?: (summary: AppwriteMessageSummary) => void;
  onMessageSummaryUpdated?: (summary: AppwriteMessageSummary) => void;
  onMessageSummaryDeleted?: (summary: AppwriteMessageSummary) => void;
  onProjectCreated?: (project: AppwriteProject) => void;
  onProjectUpdated?: (project: AppwriteProject) => void;
  onProjectDeleted?: (project: AppwriteProject) => void;
};

export class AppwriteRealtime {
  private static subscriptions: Map<string, () => void> = new Map();
  private static callbacks: RealtimeCallbacks = {};
  
  // Set callbacks for UI updates
  static setCallbacks(callbacks: RealtimeCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
  
  // Subscribe to all collections (threads, messages, message_summaries, projects)
  static subscribeToAll(userId: string): void {
    this.subscribeToThreads(userId);
    this.subscribeToMessages(userId);
    this.subscribeToMessageSummaries(userId);
    this.subscribeToProjects(userId);
  }
  
  // Unsubscribe from all collections
  static unsubscribeFromAll(): void {
    for (const unsubscribe of this.subscriptions.values()) {
      unsubscribe();
    }
    this.subscriptions.clear();
  }
  
  // Subscribe to thread collection changes
  static subscribeToThreads(userId: string): void {
    if (this.subscriptions.has('threads')) {
      console.log('[AppwriteRealtime] Already subscribed to threads');
      return; // Already subscribed
    }

    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${THREADS_COLLECTION_ID}.documents`,
      (response: RealtimeResponseEvent<AppwriteThread>) => {
        // Process only events for the current user
        if (response.payload?.userId !== userId) {
          return;
        }

        // Handle different event types - check if event contains the action
        const eventType = response.events[0];

        if (eventType.includes('.create')) {
          this.handleThreadCreated(response.payload);
        } else if (eventType.includes('.update')) {
          this.handleThreadUpdated(response.payload);
        } else if (eventType.includes('.delete')) {
          this.handleThreadDeleted(response.payload);
        }
      }
    );

    this.subscriptions.set('threads', unsubscribe);
    console.log('[AppwriteRealtime] Successfully subscribed to threads');
  }
  
  // Subscribe to message collection changes
  static subscribeToMessages(userId: string): void {
    if (this.subscriptions.has('messages')) {
      console.log('[AppwriteRealtime] Already subscribed to messages');
      return; // Already subscribed
    }

    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${MESSAGES_COLLECTION_ID}.documents`,
      (response: RealtimeResponseEvent<AppwriteMessage>) => {
        // Process only events for the current user
        if (response.payload?.userId !== userId) {
          return;
        }

        // Handle different event types - check if event contains the action
        const eventType = response.events[0];

        if (eventType.includes('.create')) {
          this.handleMessageCreated(response.payload);
        } else if (eventType.includes('.update')) {
          this.handleMessageUpdated(response.payload);
        } else if (eventType.includes('.delete')) {
          this.handleMessageDeleted(response.payload);
        }
      }
    );

    this.subscriptions.set('messages', unsubscribe);
    console.log('[AppwriteRealtime] Successfully subscribed to messages');
  }
  
  // Subscribe to message summary collection changes
  static subscribeToMessageSummaries(userId: string): void {
    if (this.subscriptions.has('message_summaries')) {
      return; // Already subscribed
    }
    
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${MESSAGE_SUMMARIES_COLLECTION_ID}.documents`,
      (response: RealtimeResponseEvent<AppwriteMessageSummary>) => {
        // Process only events for the current user
        if (response.payload?.userId !== userId) {
          return;
        }
        
        // Handle different event types
        switch (response.events[0]) {
          case 'databases.*.collections.*.documents.*.create':
            this.handleMessageSummaryCreated(response.payload);
            break;
          case 'databases.*.collections.*.documents.*.update':
            this.handleMessageSummaryUpdated(response.payload);
            break;
          case 'databases.*.collections.*.documents.*.delete':
            this.handleMessageSummaryDeleted(response.payload);
            break;
        }
      }
    );
    
    this.subscriptions.set('message_summaries', unsubscribe);
  }

  // Subscribe to project collection changes
  static subscribeToProjects(userId: string): void {
    if (this.subscriptions.has('projects')) {
      console.log('[AppwriteRealtime] Already subscribed to projects');
      return; // Already subscribed
    }

    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${PROJECTS_COLLECTION_ID}.documents`,
      (response: RealtimeResponseEvent<AppwriteProject>) => {
        // Process only events for the current user
        if (response.payload?.userId !== userId) {
          return;
        }

        // Handle different event types - check if event contains the action
        const eventType = response.events[0];

        if (eventType.includes('.create')) {
          this.handleProjectCreated(response.payload);
        } else if (eventType.includes('.update')) {
          this.handleProjectUpdated(response.payload);
        } else if (eventType.includes('.delete')) {
          this.handleProjectDeleted(response.payload);
        }
      }
    );

    this.subscriptions.set('projects', unsubscribe);
    console.log('[AppwriteRealtime] Successfully subscribed to projects');
  }

  // --------- Thread Event Handlers ---------
  
  // Handle thread created event
  private static handleThreadCreated(thread: AppwriteThread): void {
    // Trigger UI update callback
    if (this.callbacks.onThreadCreated) {
      this.callbacks.onThreadCreated(thread);
    }
  }
  
  // Handle thread updated event
  private static handleThreadUpdated(thread: AppwriteThread): void {
    // Trigger UI update callback
    if (this.callbacks.onThreadUpdated) {
      this.callbacks.onThreadUpdated(thread);
    }
  }
  
  // Handle thread deleted event
  private static handleThreadDeleted(thread: AppwriteThread): void {
    // Trigger UI update callback
    if (this.callbacks.onThreadDeleted) {
      this.callbacks.onThreadDeleted(thread);
    }
  }
  
  // --------- Message Event Handlers ---------
  
  // Handle message created event
  private static handleMessageCreated(message: AppwriteMessage): void {
    // Trigger UI update callback
    if (this.callbacks.onMessageCreated) {
      this.callbacks.onMessageCreated(message);
    }
  }
  
  // Handle message updated event
  private static handleMessageUpdated(message: AppwriteMessage): void {
    // Trigger UI update callback
    if (this.callbacks.onMessageUpdated) {
      this.callbacks.onMessageUpdated(message);
    }
  }
  
  // Handle message deleted event
  private static handleMessageDeleted(message: AppwriteMessage): void {
    // Trigger UI update callback
    if (this.callbacks.onMessageDeleted) {
      this.callbacks.onMessageDeleted(message);
    }
  }
  
  // --------- Message Summary Event Handlers ---------
  
  // Handle message summary created event
  private static handleMessageSummaryCreated(summary: AppwriteMessageSummary): void {
    // Trigger UI update callback
    if (this.callbacks.onMessageSummaryCreated) {
      this.callbacks.onMessageSummaryCreated(summary);
    }
  }
  
  // Handle message summary updated event
  private static handleMessageSummaryUpdated(summary: AppwriteMessageSummary): void {
    // Trigger UI update callback
    if (this.callbacks.onMessageSummaryUpdated) {
      this.callbacks.onMessageSummaryUpdated(summary);
    }
  }
  
  // Handle message summary deleted event
  private static handleMessageSummaryDeleted(summary: AppwriteMessageSummary): void {
    // Trigger UI update callback
    if (this.callbacks.onMessageSummaryDeleted) {
      this.callbacks.onMessageSummaryDeleted(summary);
    }
  }

  // --------- Project Event Handlers ---------

  // Handle project created event
  private static handleProjectCreated(project: AppwriteProject): void {
    // Trigger UI update callback
    if (this.callbacks.onProjectCreated) {
      this.callbacks.onProjectCreated(project);
    }
  }

  // Handle project updated event
  private static handleProjectUpdated(project: AppwriteProject): void {
    // Trigger UI update callback
    if (this.callbacks.onProjectUpdated) {
      this.callbacks.onProjectUpdated(project);
    }
  }

  // Handle project deleted event
  private static handleProjectDeleted(project: AppwriteProject): void {
    // Trigger UI update callback
    if (this.callbacks.onProjectDeleted) {
      this.callbacks.onProjectDeleted(project);
    }
  }
}
