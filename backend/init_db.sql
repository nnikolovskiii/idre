CREATE TABLE public.chat
(
    chat_id    uuid                     DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id    text                                               NOT NULL,
    thread_id  uuid                                               NOT NULL
        REFERENCES public.thread
            ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.chat
    OWNER TO postgres;

CREATE INDEX chat_thread_id_idx ON public.chat (thread_id);