  // Account Tasks methods
  async getAccountTasks(tenantId: string): Promise<AccountTask[]> {
    return Array.from(this.accountTasks.values()).filter(
      (task) => task.tenantId === tenantId
    );
  }

  async getAccountTasksByAccount(accountId: number, tenantId: string): Promise<AccountTask[]> {
    return Array.from(this.accountTasks.values()).filter(
      (task) => task.accountId === accountId && task.tenantId === tenantId
    );
  }

  async getAccountTask(id: number, tenantId: string): Promise<AccountTask | undefined> {
    const task = this.accountTasks.get(id);
    if (task && task.tenantId === tenantId) {
      return task;
    }
    return undefined;
  }

  async createAccountTask(insertTask: InsertAccountTask): Promise<AccountTask> {
    const id = this.currentAccountTaskId++;
    const now = new Date();
    const task: AccountTask = {
      ...insertTask,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.accountTasks.set(id, task);
    return task;
  }

  async createAccountTasks(tasks: InsertAccountTask[]): Promise<AccountTask[]> {
    if (tasks.length === 0) {
      return [];
    }
    
    const createdTasks: AccountTask[] = [];
    for (const taskData of tasks) {
      const task = await this.createAccountTask(taskData);
      createdTasks.push(task);
    }
    
    return createdTasks;
  }

  async updateAccountTask(id: number, data: Partial<AccountTask>, tenantId: string): Promise<AccountTask> {
    const task = await this.getAccountTask(id, tenantId);
    if (!task) {
      throw new Error(`Account task not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    const updatedTask: AccountTask = {
      ...task,
      ...data,
      updatedAt: new Date()
    };
    
    this.accountTasks.set(id, updatedTask);
    return updatedTask;
  }