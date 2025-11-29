const { createApp } = Vue;

createApp({
    data() {
        return {
            // =========================
            // API & CONFIGURATION
            // =========================
            apiBaseUrl: 'http://10.0.0.60:5000/api',

            // =========================
            // CORE DATA
            // =========================
            movies: [],
            stats: null,
            analysisStatus: {
                status: 'idle',
                progress: 0,
                current_step: '',
                total: 0,
                error: null
            },

            // =========================
            // UI STATE
            // =========================
            isAnalyzing: false,
            error: null,
            viewMode: 'table',          // 'table' or 'grid'

            // =========================
            // FILTERS & SORTING
            // =========================
            filters: {
                minScore: 0,
                search: '',
                sortBy: 'delete_score'
            },

            // =========================
            // PAGINATION
            // =========================
            currentPage: 1,
            pageSize: 20,

            // =========================
            // CHART
            // =========================
            priorityChart: null
        };
    },

    computed: {
        filteredMovies() {
            let filtered = this.movies.filter(movie => {
                // Minimum delete score
                if (movie.delete_score < this.filters.minScore) {
                    return false;
                }

                // Search by title
                if (this.filters.search) {
                    const term = this.filters.search.toLowerCase();
                    return movie.title.toLowerCase().includes(term);
                }

                return true;
            });

            // Sorting logic
            filtered.sort((a, b) => {
                const field = this.filters.sortBy;

                if (field === 'title') {
                    return a.title.localeCompare(b.title);
                }
                if (field === 'year') {
                    return (b.year || 0) - (a.year || 0);
                }
                if (field === 'file_size_gb') {
                    return (b.file_size_gb || 0) - (a.file_size_gb || 0);
                }

                // Default: highest delete_score first
                return (b.delete_score || 0) - (a.delete_score || 0);
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
        }
    },

    methods: {
        async loadData() {
            try {
                // Fetch stats
                const statsRes = await axios.get(`${this.apiBaseUrl}/stats`);
                this.stats = statsRes.data;

                // Fetch movies
                const moviesRes = await axios.get(`${this.apiBaseUrl}/movies`);
                this.movies = moviesRes.data.movies || [];

                // Update chart after render
                this.$nextTick(() => {
                    this.updateChart();
                });

                this.error = null;
            } catch (err) {
                if (err.response?.status === 404) {
                    this.stats = null;
                    this.movies = [];
                } else {
                    this.error = `Failed to load data: ${err.message}`;
                    console.error('Load error:', err);
                }
            }
        },

        async refreshAnalysis() {
            this.isAnalyzing = true;
            this.error = null;

            try {
                const res = await axios.post(`${this.apiBaseUrl}/analyze`, {
                    force_refresh: true
                });

                if (res.data.status === 'complete') {
                    await this.loadData();
                } else {
                    this.pollAnalysisStatus();
                }
            } catch (err) {
                this.error = `Analysis failed: ${err.message}`;
                console.error('Trigger error:', err);
            } finally {
                this.isAnalyzing = false;
            }
        },

        pollAnalysisStatus() {
            const interval = setInterval(async () => {
                try {
                    const res = await axios.get(`${this.apiBaseUrl}/status`);
                    this.analysisStatus = res.data;

                    if (res.data.status === 'complete') {
                        clearInterval(interval);
                        await this.loadData();
                        this.isAnalyzing = false;
                    } else if (res.data.status === 'error') {
                        clearInterval(interval);
                        this.error = res.data.error || 'Unknown error';
                        this.isAnalyzing = false;
                    }
                } catch (err) {
                    clearInterval(interval);
                    this.error = 'Connection lost';
                    this.isAnalyzing = false;
                }
            }, 2000);
        },

        async clearCache() {
            if (!confirm('Clear cache? This will force a full re-analysis.')) {
                return;
            }

            try {
                await axios.post(`${this.apiBaseUrl}/cache/clear`);
                this.movies = [];
                this.stats = null;
                this.analysisStatus.progress = 0;
                alert('Cache cleared');
            } catch (err) {
                this.error = 'Cache clear failed';
                console.error(err);
            }
        },

        updateChart() {
            if (!this.stats || !document.getElementById('priorityChart')) {
                return;
            }

            const ctx = document.getElementById('priorityChart').getContext('2d');

            if (this.priorityChart) {
                this.priorityChart.destroy();
            }

            this.priorityChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: [
                        'High Priority (70+)',
                        'Medium Priority (40–69)',
                        'Low Priority (<40)'
                    ],
                    datasets: [{
                        data: [
                            this.stats.delete_candidates.high_priority,
                            this.stats.delete_candidates.medium_priority,
                            this.stats.delete_candidates.low_priority
                        ],
                        backgroundColor: ['#e74c3c', '#f39c12', '#2ecc71'],
                        borderColor: '#1a202c',
                        borderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#e2e8f0',
                                padding: 20,
                                font: { size: 13 }
                            }
                        }
                    }
                }
            });
        },

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
            if (!dateString) return 'Never';
            return new Date(dateString).toLocaleString();
        },

        nextPage() {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        },

        prevPage() {
            if (this.currentPage > 1) {
                this.currentPage--;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    },

    watch: {
        'filters.minScore'() { this.currentPage = 1; },
        'filters.search'() { this.currentPage = 1; },
        'filters.sortBy'() { this.currentPage = 1; }
    },

    async mounted() {
        console.log('%cPlexIQ v1.0 Initialized', 'color: #8b5cf6; font-size: 18px; font-weight: bold;');

        await this.loadData();

        try {
            const health = await axios.get(`${this.apiBaseUrl}/health`);
            console.log('Backend healthy:', health.data);
        } catch (err) {
            this.error = 'Cannot connect to PlexIQ API (port 5000)';
            console.error('Health check failed:', err);
        }
    }
}).mount('#app');