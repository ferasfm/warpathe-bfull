-- Migration: Add agent telemetry support
-- This adds functionality to handle device and emulator discovery from agents

-- Function to handle agent event processing (e.g., auto-creating devices/emulators)
CREATE OR REPLACE FUNCTION public.process_agent_event()
RETURNS TRIGGER AS $$
DECLARE
    payload_data JSONB;
    device_uid TEXT;
    device_id_uuid UUID;
BEGIN
    payload_data := NEW.payload;
    
    -- Handle DEVICE_DISCOVERED
    IF NEW.event_type = 'DEVICE_DISCOVERED' THEN
        device_uid := payload_data->>'serial';
        
        IF device_uid IS NOT NULL THEN
            -- Upsert device
            INSERT INTO public.devices (agent_id, device_id, name, status, updated_at)
            VALUES (NEW.agent_id, device_uid, COALESCE(payload_data->>'model', device_uid), 'ONLINE', NOW())
            ON CONFLICT (device_id) DO UPDATE SET
                agent_id = EXCLUDED.agent_id,
                name = EXCLUDED.name,
                status = 'ONLINE',
                updated_at = NOW();
        END IF;
    END IF;

    -- Handle EMULATOR_DISCOVERED
    IF NEW.event_type = 'EMULATOR_DISCOVERED' THEN
        device_uid := payload_data->>'adbSerial';
        
        IF device_uid IS NOT NULL THEN
            -- Ensure device entry exists
            INSERT INTO public.devices (agent_id, device_id, name, status, updated_at)
            VALUES (NEW.agent_id, device_uid, payload_data->>'instanceName', 'ONLINE', NOW())
            ON CONFLICT (device_id) DO UPDATE SET
                agent_id = EXCLUDED.agent_id,
                status = 'ONLINE',
                updated_at = NOW()
            RETURNING id INTO device_id_uuid;

            -- Upsert emulator
            INSERT INTO public.emulators (agent_id, device_id, name, resolution, dpi, status, updated_at)
            VALUES (
                NEW.agent_id, 
                device_uid, 
                payload_data->>'instanceName', 
                payload_data->>'resolution', 
                (payload_data->>'dpi')::INTEGER, 
                payload_data->>'status', 
                NOW()
            )
            ON CONFLICT (device_id) DO UPDATE SET
                agent_id = EXCLUDED.agent_id,
                name = EXCLUDED.name,
                resolution = EXCLUDED.resolution,
                dpi = EXCLUDED.dpi,
                status = EXCLUDED.status,
                updated_at = NOW();
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on agent_events
DROP TRIGGER IF EXISTS tr_process_agent_event ON public.agent_events;
CREATE TRIGGER tr_process_agent_event
AFTER INSERT ON public.agent_events
FOR EACH ROW
EXECUTE FUNCTION public.process_agent_event();

-- Add unique constraint to devices.device_id and emulators.device_id
ALTER TABLE public.devices DROP CONSTRAINT IF EXISTS devices_device_id_key;
ALTER TABLE public.devices ADD CONSTRAINT devices_device_id_key UNIQUE (device_id);

ALTER TABLE public.emulators DROP CONSTRAINT IF EXISTS emulators_device_id_key;
ALTER TABLE public.emulators ADD CONSTRAINT emulators_device_id_key UNIQUE (device_id);
