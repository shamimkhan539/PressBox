import Docker from "dockerode";
import {
    DockerContainer,
    DockerImage,
    DockerService,
    PressBoxError,
} from "../../shared/types";

/**
 * Docker Manager
 *
 * Handles all Docker-related operations including container management,
 * image pulling, and Docker daemon communication.
 */
export class DockerManager {
    private docker: Docker;
    private isDockerAvailable: boolean = false;

    constructor() {
        // Initialize Docker client
        this.docker = new Docker();
    }

    /**
     * Initialize the Docker manager and check Docker availability
     */
    async initialize(): Promise<void> {
        try {
            await this.docker.ping();
            this.isDockerAvailable = true;
            console.log("Docker is available and running");
        } catch (error) {
            this.isDockerAvailable = false;
            console.warn("Docker is not available:", error);
            throw new PressBoxError(
                "Docker is not installed or not running. Please install Docker Desktop and ensure it is running.",
                "DOCKER_NOT_AVAILABLE",
                { error }
            );
        }
    }

    /**
     * Check if Docker is installed and running
     */
    async isDockerRunning(): Promise<boolean> {
        try {
            await this.docker.ping();
            this.isDockerAvailable = true;
            return true;
        } catch {
            this.isDockerAvailable = false;
            return false;
        }
    }

    /**
     * Get all Docker containers
     */
    async getContainers(all: boolean = true): Promise<DockerContainer[]> {
        this.ensureDockerAvailable();

        try {
            const containers = await this.docker.listContainers({ all });

            return containers.map((container) => ({
                id: container.Id,
                name: container.Names[0]?.replace("/", "") || "unnamed",
                image: container.Image,
                status: container.Status,
                ports: container.Ports.map((port) => ({
                    host: port.PublicPort || 0,
                    container: port.PrivatePort,
                    protocol: port.Type as "tcp" | "udp",
                })),
                created: new Date(container.Created * 1000),
                labels: container.Labels || {},
            }));
        } catch (error) {
            throw new PressBoxError(
                "Failed to list Docker containers",
                "DOCKER_LIST_ERROR",
                { error }
            );
        }
    }

    /**
     * Get all Docker images
     */
    async getImages(): Promise<DockerImage[]> {
        this.ensureDockerAvailable();

        try {
            const images = await this.docker.listImages();

            return images.map((image) => ({
                id: image.Id,
                repository: image.RepoTags?.[0]?.split(":")[0] || "none",
                tag: image.RepoTags?.[0]?.split(":")[1] || "none",
                size: image.Size,
                created: new Date(image.Created * 1000),
            }));
        } catch (error) {
            throw new PressBoxError(
                "Failed to list Docker images",
                "DOCKER_LIST_ERROR",
                { error }
            );
        }
    }

    /**
     * Pull a Docker image
     */
    async pullImage(
        imageName: string,
        onProgress?: (progress: any) => void
    ): Promise<void> {
        this.ensureDockerAvailable();

        try {
            const stream = await this.docker.pull(imageName);

            return new Promise((resolve, reject) => {
                this.docker.modem.followProgress(
                    stream,
                    (err, res) => {
                        if (err) {
                            reject(
                                new PressBoxError(
                                    `Failed to pull image ${imageName}`,
                                    "DOCKER_PULL_ERROR",
                                    { error: err }
                                )
                            );
                        } else {
                            resolve();
                        }
                    },
                    onProgress
                );
            });
        } catch (error) {
            throw new PressBoxError(
                `Failed to pull image ${imageName}`,
                "DOCKER_PULL_ERROR",
                { error }
            );
        }
    }

    /**
     * Create and start a container
     */
    async createContainer(config: {
        name: string;
        image: string;
        ports?: { [key: string]: [{ HostPort: string }] };
        environment?: string[];
        volumes?: string[];
        workingDir?: string;
        cmd?: string[];
        labels?: { [key: string]: string };
    }): Promise<Docker.Container> {
        this.ensureDockerAvailable();

        try {
            const container = await this.docker.createContainer({
                Image: config.image,
                name: config.name,
                ExposedPorts: config.ports
                    ? Object.keys(config.ports).reduce((acc, port) => {
                          acc[port] = {};
                          return acc;
                      }, {} as any)
                    : undefined,
                HostConfig: {
                    PortBindings: config.ports,
                    Binds: config.volumes,
                    RestartPolicy: { Name: "unless-stopped" },
                },
                Env: config.environment,
                WorkingDir: config.workingDir,
                Cmd: config.cmd,
                Labels: {
                    "pressbox.managed": "true",
                    ...config.labels,
                },
            });

            return container;
        } catch (error) {
            throw new PressBoxError(
                `Failed to create container ${config.name}`,
                "DOCKER_CREATE_ERROR",
                { error }
            );
        }
    }

    /**
     * Start a container
     */
    async startContainer(containerId: string): Promise<void> {
        this.ensureDockerAvailable();

        try {
            const container = this.docker.getContainer(containerId);
            await container.start();
        } catch (error) {
            throw new PressBoxError(
                `Failed to start container ${containerId}`,
                "DOCKER_START_ERROR",
                { error }
            );
        }
    }

    /**
     * Stop a container
     */
    async stopContainer(
        containerId: string,
        timeout: number = 10
    ): Promise<void> {
        this.ensureDockerAvailable();

        try {
            const container = this.docker.getContainer(containerId);
            await container.stop({ t: timeout });
        } catch (error) {
            throw new PressBoxError(
                `Failed to stop container ${containerId}`,
                "DOCKER_STOP_ERROR",
                { error }
            );
        }
    }

    /**
     * Remove a container
     */
    async removeContainer(
        containerId: string,
        force: boolean = false
    ): Promise<void> {
        this.ensureDockerAvailable();

        try {
            const container = this.docker.getContainer(containerId);
            await container.remove({ force });
        } catch (error) {
            throw new PressBoxError(
                `Failed to remove container ${containerId}`,
                "DOCKER_REMOVE_ERROR",
                { error }
            );
        }
    }

    /**
     * Get container logs
     */
    async getContainerLogs(
        containerId: string,
        tail: number = 100
    ): Promise<string> {
        this.ensureDockerAvailable();

        try {
            const container = this.docker.getContainer(containerId);
            const logs = await container.logs({
                stdout: true,
                stderr: true,
                tail,
                timestamps: true,
            });

            return logs.toString();
        } catch (error) {
            throw new PressBoxError(
                `Failed to get logs for container ${containerId}`,
                "DOCKER_LOGS_ERROR",
                { error }
            );
        }
    }

    /**
     * Execute a command in a container
     */
    async execInContainer(
        containerId: string,
        command: string[],
        options?: { outputFile?: string }
    ): Promise<string> {
        this.ensureDockerAvailable();

        try {
            const container = this.docker.getContainer(containerId);
            const exec = await container.exec({
                Cmd: command,
                AttachStdout: true,
                AttachStderr: true,
            });

            const stream = await exec.start({});

            return new Promise((resolve, reject) => {
                let output = "";

                stream.on("data", (chunk: Buffer) => {
                    output += chunk.toString();
                });

                stream.on("end", () => {
                    resolve(output);
                });

                stream.on("error", (error: Error) => {
                    reject(
                        new PressBoxError(
                            `Failed to execute command in container ${containerId}`,
                            "DOCKER_EXEC_ERROR",
                            { error }
                        )
                    );
                });
            });
        } catch (error) {
            throw new PressBoxError(
                `Failed to execute command in container ${containerId}`,
                "DOCKER_EXEC_ERROR",
                { error }
            );
        }
    }

    /**
     * Create a Docker Compose configuration
     */
    generateComposeConfig(services: DockerService[]): string {
        const config = {
            version: "3.8",
            services: {} as any,
            volumes: {} as any,
            networks: {
                pressbox: {
                    driver: "bridge",
                },
            },
        };

        services.forEach((service) => {
            config.services[service.name] = {
                image: service.image,
                ports:
                    service.ports?.map((p) => `${p.host}:${p.container}`) || [],
                environment: service.environment || {},
                volumes:
                    service.volumes?.map(
                        (v) =>
                            `${v.host}:${v.container}${v.mode ? ":" + v.mode : ""}`
                    ) || [],
                depends_on: service.depends_on || [],
                networks: ["pressbox"],
                restart: "unless-stopped",
            };
        });

        return JSON.stringify(config, null, 2);
    }

    /**
     * Check if an image exists locally
     */
    async imageExists(imageName: string): Promise<boolean> {
        try {
            const images = await this.getImages();
            return images.some(
                (image) =>
                    `${image.repository}:${image.tag}` === imageName ||
                    image.repository === imageName
            );
        } catch {
            return false;
        }
    }

    /**
     * Ensure Docker is available before executing operations
     */
    private ensureDockerAvailable(): void {
        if (!this.isDockerAvailable) {
            throw new PressBoxError(
                "Docker is not available. Please ensure Docker Desktop is installed and running.",
                "DOCKER_NOT_AVAILABLE"
            );
        }
    }

    /**
     * Get Docker system information
     */
    async getSystemInfo(): Promise<any> {
        this.ensureDockerAvailable();

        try {
            return await this.docker.info();
        } catch (error) {
            throw new PressBoxError(
                "Failed to get Docker system information",
                "DOCKER_INFO_ERROR",
                { error }
            );
        }
    }

    /**
     * Clean up unused containers, images, and volumes
     */
    async cleanup(): Promise<void> {
        this.ensureDockerAvailable();

        try {
            await this.docker.pruneContainers();
            await this.docker.pruneImages();
            await this.docker.pruneVolumes();
        } catch (error) {
            throw new PressBoxError(
                "Failed to cleanup Docker resources",
                "DOCKER_CLEANUP_ERROR",
                { error }
            );
        }
    }

    /**
     * Check if a specific service is running for a site
     */
    async isServiceRunning(
        siteId: string,
        serviceName: string
    ): Promise<boolean> {
        this.ensureDockerAvailable();

        try {
            const containerName = `${siteId}_${serviceName}`;
            const containers = await this.getContainers(false); // Only running containers
            return containers.some(
                (container) => container.name === containerName
            );
        } catch (error) {
            console.warn(
                `Failed to check service status for ${serviceName}:`,
                error
            );
            return false;
        }
    }

    /**
     * Stop a specific service for a site
     */
    async stopService(siteId: string, serviceName: string): Promise<void> {
        this.ensureDockerAvailable();

        try {
            const containerName = `${siteId}_${serviceName}`;
            await this.stopContainer(containerName);
            console.log(`Stopped service ${serviceName} for site ${siteId}`);
        } catch (error) {
            throw new PressBoxError(
                `Failed to stop service ${serviceName} for site ${siteId}`,
                "DOCKER_STOP_SERVICE_ERROR",
                { error, siteId, serviceName }
            );
        }
    }

    /**
     * Stop all services for a site
     */
    async stopAllServices(siteId: string): Promise<void> {
        this.ensureDockerAvailable();

        try {
            const containers = await this.getContainers(true);
            const siteContainers = containers.filter(
                (container) => container.labels["pressbox.site"] === siteId
            );

            for (const container of siteContainers) {
                try {
                    await this.stopContainer(container.id);
                } catch (error) {
                    console.warn(
                        `Failed to stop container ${container.name}:`,
                        error
                    );
                }
            }

            console.log(`Stopped all services for site ${siteId}`);
        } catch (error) {
            throw new PressBoxError(
                `Failed to stop all services for site ${siteId}`,
                "DOCKER_STOP_ALL_SERVICES_ERROR",
                { error, siteId }
            );
        }
    }

    /**
     * Start services using Docker Compose
     */
    async startCompose(composePath: string): Promise<void> {
        this.ensureDockerAvailable();

        const { spawn } = await import("child_process");

        return new Promise((resolve, reject) => {
            const compose = spawn("docker-compose", ["up", "-d"], {
                cwd: composePath,
                stdio: ["pipe", "pipe", "pipe"],
            });

            let stdout = "";
            let stderr = "";

            compose.stdout.on("data", (data) => {
                stdout += data.toString();
            });

            compose.stderr.on("data", (data) => {
                stderr += data.toString();
            });

            compose.on("close", (code) => {
                if (code === 0) {
                    console.log("Docker Compose started successfully");
                    resolve();
                } else {
                    reject(
                        new PressBoxError(
                            `Docker Compose failed to start`,
                            "DOCKER_COMPOSE_START_ERROR",
                            { code, stdout, stderr, composePath }
                        )
                    );
                }
            });

            compose.on("error", (error) => {
                reject(
                    new PressBoxError(
                        `Failed to execute docker-compose`,
                        "DOCKER_COMPOSE_EXEC_ERROR",
                        { error, composePath }
                    )
                );
            });
        });
    }

    /**
     * Restart services using Docker Compose
     */
    async restartCompose(composePath: string): Promise<void> {
        this.ensureDockerAvailable();

        const { spawn } = await import("child_process");

        return new Promise((resolve, reject) => {
            const compose = spawn("docker-compose", ["restart"], {
                cwd: composePath,
                stdio: ["pipe", "pipe", "pipe"],
            });

            let stdout = "";
            let stderr = "";

            compose.stdout.on("data", (data) => {
                stdout += data.toString();
            });

            compose.stderr.on("data", (data) => {
                stderr += data.toString();
            });

            compose.on("close", (code) => {
                if (code === 0) {
                    console.log("Docker Compose restarted successfully");
                    resolve();
                } else {
                    reject(
                        new PressBoxError(
                            `Docker Compose failed to restart`,
                            "DOCKER_COMPOSE_RESTART_ERROR",
                            { code, stdout, stderr, composePath }
                        )
                    );
                }
            });

            compose.on("error", (error) => {
                reject(
                    new PressBoxError(
                        `Failed to execute docker-compose restart`,
                        "DOCKER_COMPOSE_RESTART_EXEC_ERROR",
                        { error, composePath }
                    )
                );
            });
        });
    }

    /**
     * Check if a service is healthy
     */
    async checkServiceHealth(
        siteId: string,
        serviceName: string
    ): Promise<boolean> {
        this.ensureDockerAvailable();

        try {
            const containerName = `${siteId}_${serviceName}`;
            const container = this.docker.getContainer(containerName);
            const inspect = await container.inspect();

            // Check if container is running
            if (!inspect.State.Running) {
                return false;
            }

            // Check health status if health check is defined
            if (inspect.State.Health) {
                return inspect.State.Health.Status === "healthy";
            }

            // If no health check, consider running = healthy
            return true;
        } catch (error) {
            console.warn(
                `Failed to check health for service ${serviceName}:`,
                error
            );
            return false;
        }
    }

    /**
     * Update a service configuration
     */
    async updateService(
        siteId: string,
        serviceName: string,
        config: any
    ): Promise<void> {
        this.ensureDockerAvailable();

        try {
            const containerName = `${siteId}_${serviceName}`;

            // Stop the current container
            await this.stopService(siteId, serviceName);

            // Remove the container
            await this.removeContainer(containerName, true);

            // Create new container with updated config
            const newContainer = await this.createContainer({
                name: containerName,
                image: config.image,
                ...config,
            });

            // Start the new container
            await this.startContainer(newContainer.id);

            console.log(`Updated service ${serviceName} for site ${siteId}`);
        } catch (error) {
            throw new PressBoxError(
                `Failed to update service ${serviceName} for site ${siteId}`,
                "DOCKER_UPDATE_SERVICE_ERROR",
                { error, siteId, serviceName, config }
            );
        }
    }
}
