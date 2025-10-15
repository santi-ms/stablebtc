FROM ubuntu:22.04

# 1) Paquetes del sistema (como root)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates git jq sudo \
 && rm -rf /var/lib/apt/lists/*

# 2) Usuario normal "dev" con sudo sin password
RUN useradd -ms /bin/bash dev \
 && adduser dev sudo \
 && echo "dev ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/dev

WORKDIR /home/dev
USER dev

# 3) Que el PATH del usuario ya incluya binarios locales y de starknet-foundry
ENV PATH=/home/dev/.local/bin:/home/dev/.starknet-foundry/bin:${PATH}
