FROM langchain/langgraph-api:3.11-wolfi

# -- Adding local package . --
COPY . /deps/ai-agent
# -- End of local package . --

# -- Installing all local dependencies --
RUN PYTHONDONTWRITEBYTECODE=1 uv pip install --system --no-cache-dir -c /api/constraints.txt -e /deps/*
# -- End of local dependencies install --
ENV LANGSERVE_GRAPHS='{"chat_agent": "/deps/ai-agent/src/agent/core/configs.py:chat_graph", "transcription_agent": "/deps/ai-agent/src/agent/core/configs.py:transcription_graph", "chat_name_agent": "/deps/ai-agent/src/agent/core/configs.py:chat_name_graph_compiled", "brainstorm_graph": "./src/agent/core/configs.py:brainstorm_compiled_graph", "questioner_graph": "./src/agent/core/configs.py:questioner_compiled_graph", "idea_proposition_graph": "./src/agent/core/configs.py:idea_proposition_compiled_graph", "file_name_graph": "./src/agent/core/configs.py:file_name_compiled_graph", "pros_cons_graph": "./src/agent/core/configs.py:pros_cons_compiled_graph", "content_rewriter_graph": "/deps/ai-agent/src/agent/core/configs.py:content_rewriter_compiled_graph"}'



# -- Ensure user deps didn't inadvertently overwrite langgraph-api
RUN mkdir -p /api/langgraph_api /api/langgraph_runtime /api/langgraph_license && touch /api/langgraph_api/__init__.py /api/langgraph_runtime/__init__.py /api/langgraph_license/__init__.py
RUN PYTHONDONTWRITEBYTECODE=1 uv pip install --system --no-cache-dir --no-deps -e /api
# -- End of ensuring user deps didn't inadvertently overwrite langgraph-api --
# -- Removing build deps from the final image ~<:===~~~ --
RUN pip uninstall -y pip setuptools wheel
RUN rm -rf /usr/local/lib/python*/site-packages/pip* /usr/local/lib/python*/site-packages/setuptools* /usr/local/lib/python*/site-packages/wheel* && find /usr/local/bin -name "pip*" -delete || true
RUN rm -rf /usr/lib/python*/site-packages/pip* /usr/lib/python*/site-packages/setuptools* /usr/lib/python*/site-packages/wheel* && find /usr/bin -name "pip*" -delete || true
RUN uv pip uninstall --system pip setuptools wheel && rm /usr/bin/uv /usr/bin/uvx

WORKDIR /deps/ai-agent