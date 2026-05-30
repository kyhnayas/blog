-- Create a custom type or constraint for user roles
-- Roles: 'admin', 'editor', 'reader'

-- 1. PROFILES TABLE
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  role text default 'reader'::text check (role in ('admin', 'editor', 'reader')) not null,
  adsense_pub_id text,
  adsense_slot_id text,
  
  constraint username_length check (char_length(username) >= 3)
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;

-- 2. POSTS TABLE
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique not null,
  summary text,
  content text not null,
  published boolean default false not null,
  published_at timestamp with time zone,
  author_id uuid references public.profiles(id) on delete cascade not null,
  views integer default 0 not null,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Posts
alter table public.posts enable row level security;

-- 3. FOLLOWS TABLE (Readers following Editors)
create table public.follows (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references public.profiles(id) on delete cascade not null,
  editor_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint unique_follow unique (follower_id, editor_id),
  constraint self_follow_prevent check (follower_id <> editor_id)
);

-- Enable RLS for Follows
alter table public.follows enable row level security;

-- 4. NEWSLETTER TABLE (Subscribers)
create table public.newsletter (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint email_format check (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$')
);

-- Enable RLS for Newsletter
alter table public.newsletter enable row level security;


-------------------------
-- ROW LEVEL SECURITY POLICIES --
-------------------------

-- PROFILES POLICIES
create policy "Public profiles are viewable by everyone" 
  on public.profiles for select 
  using (true);

create policy "Users can update their own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

create policy "Admins can update any profile" 
  on public.profiles for update 
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- POSTS POLICIES
create policy "Published posts are viewable by everyone" 
  on public.posts for select 
  using (published = true);

create policy "Authors can view their own draft posts" 
  on public.posts for select 
  using (auth.uid() = author_id);

create policy "Admins can view all posts" 
  on public.posts for select 
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Editors can insert their own posts" 
  on public.posts for insert 
  with check (
    auth.uid() = author_id 
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('editor', 'admin')
    )
  );

create policy "Authors can update their own posts" 
  on public.posts for update 
  using (
    auth.uid() = author_id 
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('editor', 'admin')
    )
  );

create policy "Authors can delete their own posts" 
  on public.posts for delete 
  using (auth.uid() = author_id);

create policy "Admins can update any post" 
  on public.posts for update 
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete any post" 
  on public.posts for delete 
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- FOLLOWS POLICIES
create policy "Anyone can view follows" 
  on public.follows for select 
  using (true);

create policy "Authenticated users can follow editors" 
  on public.follows for insert 
  with check (auth.uid() = follower_id);

create policy "Users can unfollow editors" 
  on public.follows for delete 
  using (auth.uid() = follower_id);

-- NEWSLETTER POLICIES
create policy "Anyone can subscribe to newsletter" 
  on public.newsletter for insert 
  with check (true);

create policy "Only admins can view subscribers" 
  on public.newsletter for select 
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Only admins can delete subscribers" 
  on public.newsletter for delete 
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-------------------------
-- TRIGGERS & FUNCTIONS --
-------------------------

-- Automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    case 
      -- The first user to sign up, or Kayhan (if we set specific email), can be set as admin.
      -- We will set default as 'reader' and let manual promotion happen, 
      -- but if it's kayhan's email, we can auto-promote to 'admin'.
      when new.email in ('kayhanayas@gmail.com', 'kyhnayas@gmail.com') then 'admin'::text -- auto promote kayhan
      else 'reader'::text
    end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution after auth.users creation
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Automatically update public.posts.published_at when post published state turns true
create or replace function public.handle_post_publishing()
returns trigger as $$
begin
  if new.published = true and old.published = false then
    new.published_at = now();
  end if;
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger on_post_updated
  before update on public.posts
  for each row execute procedure public.handle_post_publishing();
