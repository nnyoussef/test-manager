<script setup lang="ts">
import type {
    DirStruct,
    FileProps,
    FileSelection,
    FileSelectorProps,
} from '@/components/interactive';
import { computed, ref, watch } from 'vue';
import IconButton from '@/components/interactive/IconButton.vue';
import VerticalBox from '@/components/layouts/VerticalBox.vue';
import type { FunctionMap, Optional } from '@/common/types.ts';
import HorizontalBox from '@/components/layouts/HorizontalBox.vue';
import BreadCrumb from '@/components/interactive/BreadCrumb.vue';

const props = withDefaults(defineProps<FileSelectorProps>(), {
    selectPath: '',
});
const emits = defineEmits<{
    itemSelected: [data: Optional<FileSelection>];
}>();

const currentWorkingDir = ref<DirStruct>();
const currentWorkingDirFiles = computed(() => currentWorkingDir.value?.files ?? []);
const currentWorkingDirFolders = computed(() => currentWorkingDir.value?.subDir ?? {});
const isBackwardIconVisible = computed(() => currentWorkingDir.value?.parentDir !== undefined);
const breadCrumbItems = computed(() => {
    let visitedDir: DirStruct | undefined = currentWorkingDir.value;
    const breadCrumbItems = [];
    while (visitedDir) {
        const label = visitedDir?.currentWorkingDirectoryName ?? '';
        const value = visitedDir.currentWorkingDirectoryPath;
        const iconName = label ? '' : 'home';

        visitedDir = visitedDir.parentDir;
        breadCrumbItems.push({ label, value, iconName });
    }
    return breadCrumbItems.reverse();
});

const itemSelectionHandlers: FunctionMap<string, void> = {
    dir(clickedFolderName: string) {
        unselectCurrentlySelectedFile();
        currentWorkingDir.value = currentWorkingDir.value?.subDir[clickedFolderName];
        emitEvent();
    },
    file(clickedFileName: string) {
        let currentlySelectedFile;
        let previouslySelectedFile: FileProps | undefined;

        for (const file of currentWorkingDirFiles.value) {
            if (file.selected) previouslySelectedFile = file;
            if (file.name === clickedFileName) currentlySelectedFile = file;
            if (currentlySelectedFile && previouslySelectedFile) break;
        }
        if (currentlySelectedFile?.path === previouslySelectedFile?.path) return;
        currentlySelectedFile && (currentlySelectedFile.selected = true);
        previouslySelectedFile && (previouslySelectedFile.selected = false);
        emitEvent();
    },
};

const unselectCurrentlySelectedFile = () => {
    const currentlySelectedFile = currentWorkingDir.value?.files?.find((file) => file.selected);
    currentlySelectedFile && (currentlySelectedFile.selected = false);
};

const onItemClicked = (ev: MouseEvent) => {
    ev.stopPropagation();
    const el = ev.target as HTMLElement;

    const role = el.dataset.role;
    const value = el.dataset.value;
    if (role && value) {
        itemSelectionHandlers[role]?.(value);
    }
};

const backwards = () => {
    unselectCurrentlySelectedFile();
    currentWorkingDir.value = currentWorkingDir.value?.parentDir ?? currentWorkingDir.value;
    emitEvent();
};

const onDirExplorerChanged = (path: string) => {
    unselectCurrentlySelectedFile();
    let backwardWorkingDir = currentWorkingDir.value;
    while (backwardWorkingDir && backwardWorkingDir.currentWorkingDirectoryPath !== path) {
        backwardWorkingDir = backwardWorkingDir.parentDir;
    }
    currentWorkingDir.value = backwardWorkingDir ?? currentWorkingDir.value;
    emitEvent();
};

const buildDirStruct = (files: readonly FileProps[]): DirStruct => {
    const root: DirStruct = {
        files: [],
        subDir: {},
        parentDir: undefined,
        currentWorkingDirectoryPath: '',
        currentWorkingDirectoryName: '',
    };

    let selectedDir: DirStruct = root;
    const searchPath = props.selectPath.replace(/[\\/]+$/, '');
    for (const file of files) {
        const parts = file.path.replace(/[\\/]+$/, '').split(/[\\/]+/);
        let currentDir = root;
        let pathSoFar = '';

        for (let i = 0; i < parts.length - 1; i++) {
            const folder = parts[i] as string; //we are sure that the folder name is not empty
            pathSoFar = pathSoFar ? `${pathSoFar}\\${folder}` : folder;

            if (!currentDir.subDir[folder]) {
                currentDir.subDir[folder] = {
                    files: [],
                    subDir: {},
                    parentDir: currentDir,
                    currentWorkingDirectoryPath: pathSoFar,
                    currentWorkingDirectoryName: folder,
                };
            }

            currentDir = currentDir.subDir[folder];

            // Check if this folder matches the selectedPath
            if (searchPath === pathSoFar) {
                selectedDir = currentDir;
            }
        }

        currentDir.files.push({ ...file, selected: searchPath === file.path });
        if (searchPath === file.path) {
            selectedDir = currentDir;
        }
    }
    return selectedDir;
};

const emitEvent = () => {
    if (!currentWorkingDir.value) return;
    const currentWorkingDirValue = currentWorkingDir.value;
    const selectedFile = currentWorkingDirValue.files.find((file) => file.selected);

    let directory = currentWorkingDirValue?.currentWorkingDirectoryPath;
    let name = directory;
    let path = directory;
    let type: FileSelection['type'] = 'dir';
    let selected = false;

    if (selectedFile) {
        name = selectedFile.name;
        path = selectedFile.path;
        selected = selectedFile.selected;
        type = 'file';
    }

    emits('itemSelected', { name, path, selected, type, directory });
};

watch(
    () => props.files,
    (newFiles) => {
        currentWorkingDir.value = buildDirStruct(newFiles);
        emitEvent();
    },
);
</script>
<template>
    <div class="file-selector">
        <HorizontalBox class="header">
            <IconButton
                id="back_button"
                icon="back"
                :role="'backwards'"
                @click="backwards()"
                :button-text-color="isBackwardIconVisible ? 'var(--primary-color)' : 'gray'"
                :disabled="!isBackwardIconVisible"
            />
            <BreadCrumb :items="breadCrumbItems" @onItemClicked="onDirExplorerChanged" />
        </HorizontalBox>
        <div class="panel" @click="onItemClicked">
            <VerticalBox style="gap: var(--element-gap)">
                <IconButton
                    v-for="index in currentWorkingDirFolders"
                    :id="index.currentWorkingDirectoryName"
                    icon="folder"
                    :button-label="index.currentWorkingDirectoryName"
                    button-text-color="black"
                    icon-color="var(--primary-color)"
                    :role="'dir'"
                    :value="index.currentWorkingDirectoryName"
                    :disable-hover-css="true"
                    class="unselectable item"
                />
            </VerticalBox>
            <VerticalBox>
                <IconButton
                    v-for="item in currentWorkingDirFiles"
                    :key="item.name"
                    :data-selected="item.selected"
                    id="start"
                    icon="start"
                    class="unselectable item"
                    :button-label="item.name"
                    button-text-color="black"
                    icon-color="green"
                    :role="'file'"
                    :value="item.name"
                    :disable-hover-css="true"
                />
            </VerticalBox>
        </div>
    </div>
</template>
<style src="@/assets/styles/component/file-selector.css" scoped />
