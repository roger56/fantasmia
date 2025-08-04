-- Aggiornare la tabella stories per assicurarsi che sia compatibile con il sistema attuale
-- e che salvi correttamente i nomi degli autenti autenticati

-- Prima, aggiungiamo una migrazione per assicurarci che la tabella stories 
-- abbia tutti i campi necessari e sia allineata con l'interfaccia Story esistente

-- Verifica se esiste già la colonna is_public
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='stories' AND column_name='is_public') THEN
        ALTER TABLE public.stories ADD COLUMN is_public BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Verifica se esiste già la colonna language
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='stories' AND column_name='language') THEN
        ALTER TABLE public.stories ADD COLUMN language TEXT DEFAULT 'italian';
    END IF;
END $$;

-- Verifica se esiste già la colonna mode (equivalente a category)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='stories' AND column_name='mode') THEN
        ALTER TABLE public.stories ADD COLUMN mode TEXT;
        -- Copia i valori da category a mode per compatibilità
        UPDATE public.stories SET mode = category WHERE mode IS NULL;
    END IF;
END $$;

-- Verifica se esiste già la colonna status
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='stories' AND column_name='status') THEN
        ALTER TABLE public.stories ADD COLUMN status TEXT DEFAULT 'completed';
    END IF;
END $$;

-- Verifica se esiste già la colonna author_id (distinto da user_id per compatibilità)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='stories' AND column_name='author_id') THEN
        ALTER TABLE public.stories ADD COLUMN author_id TEXT;
        -- Copia i valori da user_id a author_id per compatibilità
        UPDATE public.stories SET author_id = user_id WHERE author_id IS NULL;
    END IF;
END $$;

-- Verifica se esiste già la colonna author_name (distinto da user_name per compatibilità)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='stories' AND column_name='author_name') THEN
        ALTER TABLE public.stories ADD COLUMN author_name TEXT;
        -- Copia i valori da user_name a author_name per compatibilità
        UPDATE public.stories SET author_name = user_name WHERE author_name IS NULL;
    END IF;
END $$;

-- Funzione per ottenere il nome utente dal profilo quando l'autenticazione è attiva
CREATE OR REPLACE FUNCTION get_user_display_name(p_user_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    display_name TEXT;
BEGIN
    -- Cerca prima nei profili utente
    SELECT name INTO display_name
    FROM public.user_profiles 
    WHERE user_id = p_user_id;
    
    -- Se non trovato, restituisci un nome di default
    IF display_name IS NULL THEN
        RETURN 'Utente Sconosciuto';
    END IF;
    
    RETURN display_name;
END;
$$;

-- Trigger per auto-popolare il nome autore quando si inserisce una storia
CREATE OR REPLACE FUNCTION auto_populate_author_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    -- Se author_name è vuoto o null, prova a recuperarlo dal profilo
    IF NEW.author_name IS NULL OR NEW.author_name = '' OR NEW.author_name = 'Anonimo' OR NEW.author_name = 'Utente Anonimo' THEN
        -- Se abbiamo un user_id da auth, usa quello
        IF auth.uid() IS NOT NULL THEN
            NEW.author_name := get_user_display_name((auth.uid())::TEXT);
            NEW.author_id := (auth.uid())::TEXT;
        -- Altrimenti usa l'author_id fornito se presente
        ELSIF NEW.author_id IS NOT NULL AND NEW.author_id != 'anonymous' THEN
            NEW.author_name := get_user_display_name(NEW.author_id);
        END IF;
    END IF;
    
    -- Assicurati che user_id sia popolato per compatibilità
    IF NEW.user_id IS NULL AND NEW.author_id IS NOT NULL THEN
        NEW.user_id := NEW.author_id;
    END IF;
    
    -- Assicurati che user_name sia popolato per compatibilità
    IF NEW.user_name IS NULL AND NEW.author_name IS NOT NULL THEN
        NEW.user_name := NEW.author_name;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Applica il trigger alla tabella stories
DROP TRIGGER IF EXISTS trigger_auto_populate_author_name ON public.stories;
CREATE TRIGGER trigger_auto_populate_author_name
    BEFORE INSERT OR UPDATE ON public.stories
    FOR EACH ROW
    EXECUTE FUNCTION auto_populate_author_name();