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
        command: string[]
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
}
