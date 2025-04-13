-- Create messages table for farmer-consumer communication
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    farm_id uuid REFERENCES public.farms(id) ON DELETE CASCADE,
    subject text,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    read boolean DEFAULT false NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_recipient_id_idx ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS messages_farm_id_idx ON public.messages(farm_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at);

-- Set up Row Level Security (RLS) for messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages they've sent or received
CREATE POLICY "Users can view messages they've sent or received" 
ON public.messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Users can insert messages they're sending
CREATE POLICY "Users can send messages" 
ON public.messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- Users can update only messages they've received (to mark as read)
CREATE POLICY "Users can update messages they've received" 
ON public.messages FOR UPDATE
USING (auth.uid() = recipient_id);

-- Users can delete messages they've sent or received
CREATE POLICY "Users can delete their own messages" 
ON public.messages FOR DELETE
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Grant privileges
GRANT ALL ON public.messages TO authenticated;
GRANT SELECT ON public.messages TO anon;

-- Function to notify farmer via email when they receive a message
-- Note: This would require Supabase Edge Functions or Webhook to actually send emails
CREATE OR REPLACE FUNCTION public.notify_farmer_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Here you would typically make an API call to send an email
  -- For now, we'll just log the message in another table
  INSERT INTO public.notifications(
    user_id, 
    type, 
    title,
    content,
    related_id
  ) VALUES (
    NEW.recipient_id,
    'message',
    'New message received',
    'You have received a new message regarding farm ' || (SELECT name FROM farms WHERE id = NEW.farm_id),
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a new message is inserted
CREATE TRIGGER message_notification_trigger
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_farmer_message();

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL,
    title text NOT NULL,
    content text,
    related_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    read boolean DEFAULT false NOT NULL
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at);

-- Set up RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own notifications (to mark as read)
CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Grant privileges for notifications
GRANT ALL ON public.notifications TO authenticated;
GRANT SELECT ON public.notifications TO anon; 