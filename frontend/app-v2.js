const { createApp } = Vue;

createApp({
    data() {
        return {
            // API Configuration
            apiBaseUrl: 'http://10.0.0.60:5000/api',

            // Core Data
            movies: [],
            stats: null,
            analysisStatus: {
                status: 'idle',
                progress: 0,
                current_step: '',
                total: 0,
                error: null
            },

            // UI State
            isAnalyzing: false,
            error: null,
            viewMode: 'table',

            // Filters
            filters: {
                minScore: 0,
                search: '',
                sortBy: 'delete_score'
            },

            // Pagination
            currentPage: 1,
            pageSize: 20,

            // The Untouchables - Protected movies (stored in localStorage)
            untouchables: [],

            // Mass Selection
            selectedMovies: [],
            allSelected: false,

            // Modals
            showUntouchablesModal: false,
            showMassDeleteConfirm: false,

            // Delete Confirmation
            deleteConfirm: {
                step1: false,
                step2: false,
                step3: false,
                password: ''
            },

            // Chart
            priorityChart: null
        };
    },

    computed: {
        filteredMovies() {
            let filtered = this.movies.filter(movie => {
                // Filter by delete score
                if (movie.delete_score < this.filters.minScore) return false;

                // Filter by search term
                if (this.filters.search) {
                    const searchLower = this.filters.search.toLowerCase();
                    if (!movie.title.toLowerCase().includes(searchLower)) return false;
                }

                // Exclude untouchables from delete candidates
                if (this.isUntouchable(movie)) return false;

                return true;
            });

            // Sort
            filtered.sort((a, b) => {
                switch (this.filters.sortBy) {
                    case 'delete_score':
                        return b.delete_score - a.delete_score;
                    case 'file_size_gb':
                        return b.file_size_gb - a.file_size_gb;
                    case 'title':
                        return a.title.localeCompare(b.title);
                    case 'year':
                        return (b.year || 0) - (a.year || 0);
                    case 'days_idle':
                        return this.calculateDaysIdleRaw(b) - this.calculateDaysIdleRaw(a);
                    default:
                        return 0;
                }
            });

            return filtered;
        },

        paginatedMovies() {
            const start = (this.currentPage - 1) * this.pageSize;
            const end = start + this.pageSize;
            return this.filteredMovies.slice(start, end);
        },

        totalPages() {
            return Math.ceil(this.filteredMovies.length / this.pageSize);
        },

        deleteConfirmStep() {
            if (this.deleteConfirm.step1 && this.deleteConfirm.step2 && this.deleteConfirm.step3) return 3;
            if (this.deleteConfirm.step1 && this.deleteConfirm.step2) return 2;
            if (this.deleteConfirm.step1) return 1;
            return 0;
        },

        canExecuteDelete() {
            return this.deleteConfirmStep === 3 && this.deleteConfirm.password.length > 0;
        }
    },

    mounted() {
        this.loadData();
        this.loadUntouchables();
        this.startStatusPolling();
    },

    methods: {
        // ==================== DATA LOADING ====================
        async loadData() {
            try {
                // Load cached movies
                const moviesResponse = await axios.get(`${this.apiBaseUrl}/movies`);
                if (moviesResponse.data.movies) {
                    this.movies = moviesResponse.data.movies;
                }

                // Load stats
                const statsResponse = await axios.get(`${this.apiBaseUrl}/stats`);
                if (statsResponse.data) {
                    this.stats = statsResponse.data;
                }

                // Create chart if data available
                this.$nextTick(() => {
                    if (this.stats) {
                        this.createChart();
                    }
                });

            } catch (err) {
                if (err.response && err.response.status === 404) {
                    this.error = null; // No data yet, that's OK
                } else {
                    this.error = 'Failed to load data: ' + (err.response?.data?.error || err.message);
                }
            }
        },

        startStatusPolling() {
            setInterval(async () => {
                if (this.isAnalyzing) {
                    try {
                        const response = await axios.get(`${this.apiBaseUrl}/status`);
                        this.analysisStatus = response.data;

                        if (response.data.status === 'complete') {
                            this.isAnalyzing = false;
                            await this.loadData();
                        } else if (response.data.status === 'error') {
                            this.isAnalyzing = false;
                            this.error = response.data.error;
                        }
                    } catch (err) {
                        console.error('Status poll error:', err);
                    }
                }
            }, 1000);
        },

        async refreshAnalysis() {
            this.isAnalyzing = true;
            this.error = null;

            try {
                await axios.post(`${this.apiBaseUrl}/analyze`, {
                    force_refresh: true
                });
            } catch (err) {
                this.error = 'Analysis failed: ' + (err.response?.data?.error || err.message);
                this.isAnalyzing = false;
            }
        },

        async clearCache() {
            if (!confirm('Are you sure you want to clear the cache? This will require a full re-analysis.')) {
                return;
            }

            try {
                await axios.post(`${this.apiBaseUrl}/cache/clear`);
                this.movies = [];
                this.stats = null;
                this.error = null;
            } catch (err) {
                this.error = 'Failed to clear cache: ' + err.message;
            }
        },

        // ==================== THE UNTOUCHABLES ====================
        loadUntouchables() {
            const stored = localStorage.getItem('plexiq_untouchables');
            if (stored) {
                this.untouchables = JSON.parse(stored);
            }
        },

        saveUntouchables() {
            localStorage.setItem('plexiq_untouchables', JSON.stringify(this.untouchables));
        },

        isUntouchable(movie) {
            return this.untouchables.includes(movie.rating_key);
        },

        toggleUntouchable(movie) {
            const index = this.untouchables.indexOf(movie.rating_key);
            if (index > -1) {
                // Remove from untouchables
                this.untouchables.splice(index, 1);
            } else {
                // Add to untouchables
                this.untouchables.push(movie.rating_key);
            }
            this.saveUntouchables();

            // If movie was selected, deselect it
            if (this.isSelected(movie)) {
                this.toggleSelect(movie);
            }
        },

        getUntouchableMovies() {
            return this.movies.filter(movie => this.isUntouchable(movie));
        },

        addSelectedToUntouchables() {
            this.selectedMovies.forEach(movieKey => {
                if (!this.untouchables.includes(movieKey)) {
                    this.untouchables.push(movieKey);
                }
            });
            this.saveUntouchables();
            this.clearSelection();
        },

        // ==================== MASS SELECTION ====================
        isSelected(movie) {
            return this.selectedMovies.includes(movie.rating_key);
        },

        toggleSelect(movie) {
            if (this.isUntouchable(movie)) return; // Can't select untouchables

            const index = this.selectedMovies.indexOf(movie.rating_key);
            if (index > -1) {
                this.selectedMovies.splice(index, 1);
            } else {
                this.selectedMovies.push(movie.rating_key);
            }
            this.updateAllSelectedState();
        },

        toggleSelectAll(event) {
            if (event.target.checked) {
                // Select all on current page (excluding untouchables)
                this.paginatedMovies.forEach(movie => {
                    if (!this.isUntouchable(movie) && !this.isSelected(movie)) {
                        this.selectedMovies.push(movie.rating_key);
                    }
                });
            } else {
                // Deselect all on current page
                this.paginatedMovies.forEach(movie => {
                    const index = this.selectedMovies.indexOf(movie.rating_key);
                    if (index > -1) {
                        this.selectedMovies.splice(index, 1);
                    }
                });
            }
            this.updateAllSelectedState();
        },

        updateAllSelectedState() {
            const selectableMovies = this.paginatedMovies.filter(m => !this.isUntouchable(m));
            this.allSelected = selectableMovies.length > 0 &&
                selectableMovies.every(m => this.isSelected(m));
        },

        clearSelection() {
            this.selectedMovies = [];
            this.allSelected = false;
        },

        calculateSelectedSpace() {
            let totalSpace = 0;
            this.selectedMovies.forEach(movieKey => {
                const movie = this.movies.find(m => m.rating_key === movieKey);
                if (movie) {
                    totalSpace += movie.file_size_gb;
                }
            });
            return totalSpace.toFixed(2);
        },

        // ==================== DELETE OPERATIONS ====================
        async executeMassDelete() {
            if (!this.canExecuteDelete) return;

            // Show loading state
            const deleteBtn = document.querySelector('.modal-danger .btn-danger');
            if (deleteBtn) {
                deleteBtn.disabled = true;
                deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
            }

            try {
                // Call delete API
                const response = await axios.post(`${this.apiBaseUrl}/delete`, {
                    rating_keys: this.selectedMovies,
                    password: this.deleteConfirm.password,
                    delete_files: false,  // Only delete from Plex, not physical files (safer)
                    untouchables: this.untouchables
                });

                const results = response.data;

                // Show results
                let message = `✅ Deletion Complete!\n\n`;
                message += `Successfully deleted: ${results.succeeded.length} movies\n`;
                message += `Failed: ${results.failed.length} movies\n`;
                message += `Space freed: ${results.space_freed_gb} GB\n\n`;

                if (results.succeeded.length > 0) {
                    message += `Deleted movies:\n`;
                    results.succeeded.slice(0, 10).forEach(m => {
                        message += `  • ${m.title} (${m.year}) - ${m.size_gb} GB\n`;
                    });
                    if (results.succeeded.length > 10) {
                        message += `  ... and ${results.succeeded.length - 10} more\n`;
                    }
                }

                if (results.failed.length > 0) {
                    message += `\n⚠️ Failed deletions:\n`;
                    results.failed.forEach(m => {
                        message += `  • ${m.title}: ${m.error}\n`;
                    });
                }

                alert(message);

                // Close modal and reset
                this.showMassDeleteConfirm = false;
                this.resetDeleteConfirmation();
                this.clearSelection();

                // Reload data
                await this.loadData();

            } catch (err) {
                let errorMsg = 'Delete operation failed:\n\n';
                if (err.response) {
                    errorMsg += err.response.data.error || err.response.statusText;
                } else {
                    errorMsg += err.message;
                }
                alert(errorMsg);

                // Re-enable button
                if (deleteBtn) {
                    deleteBtn.disabled = false;
                    deleteBtn.innerHTML = `<i class="fas fa-trash-alt"></i> Delete ${this.selectedMovies.length} Movies`;
                }
            }
        },

        resetDeleteConfirmation() {
            this.deleteConfirm = {
                step1: false,
                step2: false,
                step3: false,
                password: ''
            };
        },

        // ==================== CALCULATIONS ====================
        calculateDaysIdleRaw(movie) {
            if (!movie.last_viewed) {
                // Never watched - calculate days since added
                if (movie.added_at) {
                    const added = new Date(movie.added_at);
                    const now = new Date();
                    return Math.floor((now - added) / (1000 * 60 * 60 * 24));
                }
                return 9999; // Unknown
            }

            const lastView = new Date(movie.last_viewed);
            const now = new Date();
            return Math.floor((now - lastView) / (1000 * 60 * 60 * 24));
        },

        calculateDaysIdle(movie) {
            const days = this.calculateDaysIdleRaw(movie);
            if (days === 9999) return 'Never';
            return days;
        },

        calculateFilteredSpace() {
            const total = this.filteredMovies.reduce((sum, movie) => sum + movie.file_size_gb, 0);
            return total.toFixed(1);
        },

        getRecoverableSpace() {
            if (!this.filters.minScore || this.filters.minScore === 0) {
                return this.stats?.space_recovery?.top_50_gb.toFixed(1) || '0';
            }

            // Calculate based on current filter
            return this.calculateFilteredSpace();
        },

        getRecoverableCount() {
            if (!this.filters.minScore || this.filters.minScore === 0) {
                return 50;
            }
            return this.filteredMovies.length;
        },

        // ==================== UI HELPERS ====================
        getScoreClass(score) {
            if (score >= 70) return 'score-high';
            if (score >= 40) return 'score-medium';
            return 'score-low';
        },

        getScoreBadgeClass(score) {
            if (score >= 70) return 'badge-danger';
            if (score >= 40) return 'badge-warning';
            return 'badge-success';
        },

        formatDate(dateString) {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },

        formatShortDate(dateString) {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        },

        // ==================== PAGINATION ====================
        nextPage() {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.updateAllSelectedState();
            }
        },

        prevPage() {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.updateAllSelectedState();
            }
        },

        // ==================== CHART ====================
        createChart() {
            if (this.priorityChart) {
                this.priorityChart.destroy();
            }

            const canvas = document.getElementById('priorityChart');
            if (!canvas) return;

            const ctx = canvas.getContext('2d');

            this.priorityChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['High Priority (70+)', 'Medium Priority (40-69)', 'Low Priority (0-39)', 'Protected'],
                    datasets: [{
                        data: [
                            this.stats.delete_candidates.high_priority,
                            this.stats.delete_candidates.medium_priority,
                            this.stats.delete_candidates.low_priority,
                            this.untouchables.length
                        ],
                        backgroundColor: [
                            '#ef4444', // Red for high
                            '#f59e0b', // Orange for medium
                            '#10b981', // Green for low
                            '#fbbf24'  // Yellow/gold for protected
                        ],
                        borderWidth: 2,
                        borderColor: '#1f2937'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#e5e7eb',
                                font: {
                                    size: 12
                                },
                                padding: 15
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${label}: ${value} movies (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }
    },

    watch: {
        // Recreate chart when untouchables change
        'untouchables.length'() {
            if (this.stats) {
                this.$nextTick(() => {
                    this.createChart();
                });
            }
        },

        // Reset to page 1 when filters change
        'filters.minScore'() {
            this.currentPage = 1;
        },
        'filters.search'() {
            this.currentPage = 1;
        },

        // Close delete modal when opening untouchables modal
        showUntouchablesModal(newVal) {
            if (newVal) {
                this.showMassDeleteConfirm = false;
            }
        },

        // Reset delete confirmation when modal closes
        showMassDeleteConfirm(newVal) {
            if (!newVal) {
                this.resetDeleteConfirmation();
            }
        }
    }
}).mount('#app');
