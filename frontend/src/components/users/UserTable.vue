<template>
  <div>
    <div class="flex flex-wrap items-center mb-4 gap-2">
      <input v-model="localFilters.search" @input="onFilterChange" placeholder="Search by name/email..." class="input input-bordered w-64" />
      <select v-model="localFilters.role" @change="onFilterChange" class="select select-bordered">
        <option value="">All Roles</option>
        <option value="admin">Admin</option>
        <option value="manager">Manager</option>
        <option value="user">User</option>
      </select>
      <select v-model="localFilters.status" @change="onFilterChange" class="select select-bordered">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
        <option value="deleted">Deleted</option>
      </select>
      <button class="btn btn-primary ml-auto" @click="$emit('create-user')">+ New User</button>
    </div>
    <div class="overflow-x-auto">
      <table class="table w-full">
        <thead>
          <tr>
            <th @click="sort('username')">Username</th>
            <th @click="sort('email')">Email</th>
            <th @click="sort('role')">Role</th>
            <th @click="sort('status')">Status</th>
            <th>Verified</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in sortedUsers" :key="user.id">
            <td>{{ user.username }}</td>
            <td>{{ user.email }}</td>
            <td><BaseBadge :type="roleColor(user.role)">{{ user.roleName || user.role }}</BaseBadge></td>
            <td><BaseBadge :type="statusColor(user.status)">{{ user.status }}</BaseBadge></td>
            <td>
              <span v-if="user.isVerified" class="text-green-600 font-bold">✔</span>
              <span v-else class="text-gray-400">✖</span>
            </td>
            <td>{{ formatDate(user.createdAt) }}</td>
            <td>
              <button class="btn btn-xs btn-info mr-1" @click="$emit('view-user', user)">View</button>
              <button class="btn btn-xs btn-warning mr-1" @click="$emit('edit-user', user)">Edit</button>
              <button class="btn btn-xs btn-error" @click="$emit('delete-user', user)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="loading" class="flex justify-center py-4">
        <LoadingSpinner />
      </div>
      <div v-if="!loading && users.length === 0" class="text-center py-4 text-gray-500">No users found.</div>
    </div>
    <BasePagination
      v-if="pagination.pages > 1"
      :page="pagination.page"
      :pages="pagination.pages"
      @change-page="$emit('change-page', $event)"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import BasePagination from '@/components/ui/BasePagination.vue';
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue';

const props = defineProps({
  users: Array,
  loading: Boolean,
  pagination: Object,
  filters: Object
});
const emit = defineEmits(['edit-user', 'delete-user', 'view-user', 'change-page', 'change-filters', 'create-user', 'refresh']);

const localFilters = ref({ ...props.filters });
watch(() => props.filters, (val) => {
  Object.assign(localFilters.value, val);
});

function onFilterChange() {
  emit('change-filters', { ...localFilters.value });
}

const sortKey = ref('createdAt');
const sortDir = ref('desc');
function sort(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDir.value = 'asc';
  }
}
const sortedUsers = computed(() => {
  const arr = [...props.users];
  arr.sort((a, b) => {
    let v1 = a[sortKey.value];
    let v2 = b[sortKey.value];
    if (typeof v1 === 'string') v1 = v1.toLowerCase();
    if (typeof v2 === 'string') v2 = v2.toLowerCase();
    if (v1 < v2) return sortDir.value === 'asc' ? -1 : 1;
    if (v1 > v2) return sortDir.value === 'asc' ? 1 : -1;
    return 0;
  });
  return arr;
});

function roleColor(role) {
  if (role === 'admin') return 'danger';
  if (role === 'manager') return 'info';
  return 'default';
}
function statusColor(status) {
  if (status === 'active') return 'success';
  if (status === 'suspended') return 'warning';
  if (status === 'deleted') return 'error';
  return 'default';
}
function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString();
}
</script>
