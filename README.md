# ObjectVault Frontend Application

## Desciption

The initial idea, was to create a shared password vaults, to be used in entreprises.
The reasoning was that, currently most companies, that require access to shared portal services always have the problem of:

1. How to share the password, between the employees that need access?
2. How to maintain the password up to date (when systems are requiring constant password changes)?
3. Basically how to maintain the CIA (Confidentiality, Integrity and Availability) triad?

A possible solution, was shared password vaults. By:

1. Creating a ***shared*** object store, in which all essential parts of the objects are encrypted
2. Combined with managed access to the ***vaults*** (who can read, who can create, etc)

Allows a company to create multiple secure storage areas, through which sensitive information can be shared, securily, with only the relevant users.

The intial plan, was only to encompass shared passwords, but after all this time developing, a thought popped up: *"Why limit the contents of the vaults to password objects (forms)"*.

Why not create a template based system, that allows storage of different data structures, and even, god forbid, files?

## Infrastructure

The backend storage is provided by, a possibly, sharded MariaDB Database Cluster.
**NOTE**: Sharding and Database Clusters are OPTIONAL

Access to the storage backend, is controlled by a Microservice interface. Ina production environment, this would be the only way to access the vaults.

The UX is provided by [Svelte](https://svelte.dev) based SPA Web Application

## What is missing

* REDIS Session Store
  * This would allow for the creation of distributed server farms for high workloads
  * Make session management more secure, since session sensitive data, would never leave the server farm

* RabbitMQ Action Server
  * For sending notifications, emails, etc
  * Offline processing

* Temaplates
  * Currently the only template available is for encrypted notes
  * Need to develope other templates, starting with a Site Password Storage Template

## Building and running

Since this is a multi-server application, please see the [Builder Project](https://github.com/objectvault/builder) to see how to get the system up and going.
This scripts there have the required information on how to:

1. Build and
2. Integrate the servers
3. Run the Application
