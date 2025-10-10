import Store from "electron-store";
import { createServer } from "net";

interface PortAllocation {
    siteId: string;
    siteName: string;
    port: number;
    allocated: Date;
    inUse: boolean;
}

interface PortStore {
    allocations: Record<string, PortAllocation>;
    lastPort: number;
}

/**
 * Port Manager Service
 *
 * Manages port allocation for WordPress sites to prevent conflicts
 * and ensure each site gets a unique, available port.
 */
export class PortManager {
    private store: any; // ElectronStore typing issue - using any for now
    private static readonly PORT_RANGE_START = 8000;
    private static readonly PORT_RANGE_END = 9000;
    private static readonly RESERVED_PORTS = [8080, 8443, 8888, 9000];

    constructor() {
        this.store = new Store({
            name: "port-allocations",
            defaults: {
                allocations: {},
                lastPort: PortManager.PORT_RANGE_START,
            },
        });
    }

    /**
     * Allocate a port for a site
     */
    async allocatePort(siteId: string, siteName: string): Promise<number> {
        const existingAllocation = this.getExistingAllocation(siteId);

        if (
            existingAllocation &&
            (await this.isPortAvailable(existingAllocation.port))
        ) {
            // Return existing port if still available
            existingAllocation.inUse = true;
            this.saveAllocation(existingAllocation);
            return existingAllocation.port;
        }

        // Find new available port
        const port = await this.findAvailablePort();

        const allocation: PortAllocation = {
            siteId,
            siteName,
            port,
            allocated: new Date(),
            inUse: true,
        };

        this.saveAllocation(allocation);
        console.log(`Allocated port ${port} for site ${siteName} (${siteId})`);

        return port;
    }

    /**
     * Release a port when site is stopped or deleted
     */
    releasePort(siteId: string): void {
        const allocation = this.getExistingAllocation(siteId);
        if (allocation) {
            allocation.inUse = false;
            this.saveAllocation(allocation);
            console.log(
                `Released port ${allocation.port} for site ${allocation.siteName}`
            );
        }
    }

    /**
     * Get allocated port for a site
     */
    getAllocatedPort(siteId: string): number | null {
        const allocation = this.getExistingAllocation(siteId);
        return allocation?.port || null;
    }

    /**
     * Check if a port is available
     */
    async isPortAvailable(port: number): Promise<boolean> {
        return new Promise((resolve) => {
            const server = createServer();

            server.listen(port, () => {
                server.close(() => resolve(true));
            });

            server.on("error", () => resolve(false));
        });
    }

    /**
     * Find an available port in the range
     */
    private async findAvailablePort(): Promise<number> {
        const allocations = this.getAllAllocations();
        const usedPorts = new Set([
            ...allocations.map((a) => a.port),
            ...PortManager.RESERVED_PORTS,
        ]);

        let lastPort = this.store.get("lastPort") as number;

        for (let port = lastPort; port <= PortManager.PORT_RANGE_END; port++) {
            if (!usedPorts.has(port) && (await this.isPortAvailable(port))) {
                this.store.set("lastPort", port + 1);
                return port;
            }
        }

        // If we reached the end, start from beginning
        for (let port = PortManager.PORT_RANGE_START; port < lastPort; port++) {
            if (!usedPorts.has(port) && (await this.isPortAvailable(port))) {
                this.store.set("lastPort", port + 1);
                return port;
            }
        }

        throw new Error("No available ports in range");
    }

    /**
     * Get existing allocation for a site
     */
    private getExistingAllocation(siteId: string): PortAllocation | null {
        const allocations = this.store.get("allocations") as Record<
            string,
            PortAllocation
        >;
        return allocations[siteId] || null;
    }

    /**
     * Get all allocations
     */
    private getAllAllocations(): PortAllocation[] {
        const allocations = this.store.get("allocations") as Record<
            string,
            PortAllocation
        >;
        return Object.values(allocations);
    }

    /**
     * Save allocation to store
     */
    private saveAllocation(allocation: PortAllocation): void {
        const allocations = this.store.get("allocations") as Record<
            string,
            PortAllocation
        >;
        allocations[allocation.siteId] = allocation;
        this.store.set("allocations", allocations);
    }

    /**
     * Clean up unused allocations
     */
    async cleanupUnusedAllocations(): Promise<void> {
        const allocations = this.getAllAllocations();
        const cleaned: Record<string, PortAllocation> = {};

        for (const allocation of allocations) {
            if (
                allocation.inUse ||
                (await this.isPortAvailable(allocation.port))
            ) {
                cleaned[allocation.siteId] = allocation;
            } else {
                console.log(
                    `Cleaned up allocation for port ${allocation.port} (site: ${allocation.siteName})`
                );
            }
        }

        this.store.set("allocations", cleaned);
    }

    /**
     * Get all port allocations for debugging
     */
    getAllAllocatedPorts(): PortAllocation[] {
        return this.getAllAllocations();
    }
}
