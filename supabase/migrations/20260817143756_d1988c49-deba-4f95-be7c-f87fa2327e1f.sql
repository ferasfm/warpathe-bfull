-- Update the regions for the existing stations
UPDATE public.stations SET region = 'North' WHERE city IN ('نابلس', 'سلفيت');
UPDATE public.stations SET region = 'Central' WHERE city IN ('رام الله', 'الماصيون', 'البيرة', 'بيت عور التحتا', 'أريحا');
UPDATE public.stations SET region = 'South' WHERE city IN ('بيت لحم');

-- Ensure future stations can have these values (optionally we could use an enum, but text is fine for now as it's already there)
