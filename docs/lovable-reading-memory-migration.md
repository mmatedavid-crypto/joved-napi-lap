# Lovable teendő: reading_memories élesítése

Futtasd le a Supabase éles adatbázison ezt a repo migrációt:

```text
supabase/migrations/20260608213000_reading_memories.sql
```

Elvárás:

- `public.reading_memories` tábla létrejön.
- Row Level Security engedélyezve van.
- `authenticated` felhasználó csak a saját `user_id` sorait tudja olvasni, írni és törölni.
- `service_role` teljes jogosultságot kap.
- Ezek az indexek létrejönnek:
  - `idx_reading_memories_user_created`
  - `idx_reading_memories_user_type`
  - `idx_reading_memories_anchors`

Ellenőrzés futtatás után:

- Nyisd meg a rejtett `/dev/memory` oldalt.
- Kattints a `Memória-tábla ellenőrzése` gombra.
- Sikeres állapot: `tableReady=true`.
- Profil oldalon a `Visszatérő mintáid` blokk ne dobjon hibát.
- Belépett felhasználóval egy randi/döntés/3 lap/összeillés olvasat után keletkezzen új `reading_memories` sor.

Ha a `/dev/memory` `tableReady=false` értéket mutat `PGRST205` kóddal, akkor a tábla még nincs az éles PostgREST schema cache-ben. Ilyenkor a migrációt újra ellenőrizni kell, majd szükség esetén Supabase oldalon schema cache refresh/redeploy szükséges.
